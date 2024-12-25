"use strict";
import * as THREE from "https://threejsfundamentals.org/threejs/resources/threejs/r115/build/three.module.js";
import { OrbitControls } from "https://threejsfundamentals.org/threejs/resources/threejs/r115/examples/jsm/controls/OrbitControls.js";
import { MOUSE } from "https://unpkg.com/three@0.128.0/build/three.module.js";

import {
  createCube,
  createDodecahedron,
  createOctahedron,
  createTetrahedron,
} from "./js/shapes.js";
import { dot } from "./js/point.js";

const moveButton = document.getElementById("move-button");
const set_rotation_axis = document.getElementById("set-rotation-axis");
const modalbutton1 = document.querySelector(".edit-button");
const modalbutton2 = document.querySelector(".add-button");

let lockVertices = document.getElementById("lock-vertices-cb");
let lockZoom = document.getElementById("lock-zoom-cb");
let lockRotate = document.getElementById("lock-rotate-cb");
let xyGrid = document.getElementById("xy-grid-cb");
let yzGrid = document.getElementById("yz-grid-cb");
let xzGrid = document.getElementById("xz-grid-cb");
let modalAdd = document.getElementById("add-modal");
let modalEdit = document.getElementById("edit-modal");
let container = document.getElementById("canvas-main");
let initial_pos = [5, 3, -3];
let xcomp = 1,
  ycomp = 0,
  zcomp = 0;
let spanEditModal = document.getElementsByClassName("close")[0];
let slider = document.getElementById("slider");
slider.addEventListener("input", movePoint);
document.getElementById("slider").max = document.getElementById("theta").value;
document.getElementById("slider").min = 0;
slider.step =
  (document.getElementById("slider").max -
    document.getElementById("slider").min) /
  document.getElementById("frames").value;

let rot_axis = new THREE.Vector3(xcomp, ycomp, zcomp);
rot_axis.normalize();
let total_angle = document.getElementById("theta").value;
let frames = document.getElementById("frames").value;
let present_theta = 0;
let scene,
  PI = 3.141592653589793,
  camera,
  renderer,
  orbit,
  shapes = [],
  xygrid = [],
  yzgrid = [],
  xzgrid = [],
  dragX = [],
  dragY = [],
  dragz = [],
  lock = 0,
  dir = [],
  shapeList = [],
  arrowHelper = [];

let trans_matrix = new THREE.Matrix4();
trans_matrix.set(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1);

let shapeCount = [0, 0, 0, 0];

// Modal controls for Add Shape Button
let addModal = document.getElementById("add-modal");
let spanAddModal = document.getElementsByClassName("close")[1];

spanAddModal.onclick = function () {
  addModal.style.display = "none";
};

lockVertices.addEventListener("click", updateMouseButtons);
lockZoom.addEventListener("click", updateMouseButtons);
lockRotate.addEventListener("click", updateMouseButtons);

function updateMouseButtons() {
  let leftMouse = MOUSE.PAN; // Default behavior (panning with left mouse)
  let middleMouse = MOUSE.PAN; // Set middle mouse to MOUSE.PAN but it will do nothing
  let rightMouse = MOUSE.ROTATE; // Default behavior (rotation with right mouse)

  // If lockVertices is checked, disable LEFT (no panning)
  if (lockVertices.checked) {
    leftMouse = null; // Disable left mouse button (no panning)
  }

  // If lockZoom is checked, prevent MIDDLE (no zooming)
  if (lockZoom.checked) {
    middleMouse = null; // Disable middle mouse button (no zooming)
    orbit.enableZoom = false; // Disable zoom functionality
  } else {
    orbit.enableZoom = true; // Enable zoom if lockZoom is unchecked
  }

  // If lockRotate is checked, disable RIGHT (no rotating)
  if (lockRotate.checked) {
    rightMouse = null; // Disable right mouse button (no rotating)
  }

  // Update the mouse buttons based on the checkbox states
  orbit.mouseButtons = {
    LEFT: leftMouse,
    MIDDLE: middleMouse,
    RIGHT: rightMouse,
  };

  // Ensure smooth damping and set target
  orbit.target.set(0, 0, 0);
  orbit.dampingFactor = 0.05;
  orbit.enableDamping = true;

  // Force an update on the controls
  orbit.update();
}

xyGrid.addEventListener("click", () => {
  if (xyGrid.checked) {
    let grid = new THREE.GridHelper(size, divisions);
    let vector3 = new THREE.Vector3(0, 1, 0);
    grid.lookAt(vector3);
    xygrid.push(grid);
    scene.add(xygrid[0]);
  } else {
    scene.remove(xygrid[0]);
    xygrid.pop();
  }
});
xzGrid.addEventListener("click", () => {
  if (xzGrid.checked) {
    let grid = new THREE.GridHelper(size, divisions);
    let vector3 = new THREE.Vector3(0, 0, 1);
    grid.lookAt(vector3);
    xzgrid.push(grid);
    scene.add(xzgrid[0]);
  } else {
    scene.remove(xzgrid[0]);
    xzgrid.pop();
  }
});
yzGrid.addEventListener("click", () => {
  if (yzGrid.checked) {
    let grid = new THREE.GridHelper(size, divisions);
    grid.geometry.rotateZ(PI / 2);
    // grid.lookAt(vector3);
    yzgrid.push(grid);
    scene.add(yzgrid[0]);
  } else {
    scene.remove(yzgrid[0]);
    yzgrid.pop();
  }
});

function updateShapeList(shapeList) {
  const shapeListDiv = document.getElementById("shape-list");
  shapeListDiv.innerHTML = ""; // Clear previous list

  const ul = document.createElement("ul");

  shapeList.forEach((shape) => {
    const li = document.createElement("li");

    li.innerHTML = `
      <div class="shape-info">
        <span class="shape-id">${shape.id}</span>
        <span class="coordinates">(${shape.x}, ${shape.y}, ${shape.z})</span>
      </div>
      <div class="button-group">
        <button class="select-btn" 
                data-name="${shape.id}" 
                data-coordinates="${shape.x},${shape.y},${shape.z}">
          Select
        </button>
        
      </div>
    `;
    ul.appendChild(li);
  });

  shapeListDiv.appendChild(ul);

  // Attach event listeners for Select, Edit, and Delete buttons
  document.querySelectorAll(".select-btn").forEach((button) => {
    button.addEventListener("click", handleSelect, false);
  });

  document.querySelectorAll(".edit-btn").forEach((button) => {
    button.addEventListener("click", handleEdit, false);
  });

  document.querySelectorAll(".delete-btn").forEach((button) => {
    button.addEventListener("click", handleDelete, false);
  });
}

function handleSelect(event) {
  const shapeName = event.target.getAttribute("data-name");
  const shapeCoordinates = event.target.getAttribute("data-coordinates");

  // Validate the selected shape data
  if (!shapeName || !shapeCoordinates) {
    console.error("Missing shape name or coordinates");
    return;
  }

  console.log(`Shape Selected: ${shapeName}`);
  console.log(`Coordinates: ${shapeCoordinates}`);

  // Safely parse coordinates
  let coordsArray;
  try {
    coordsArray = shapeCoordinates
      .replace(/[()]/g, "")
      .split(",")
      .map((coord) => parseFloat(coord.trim()));

    if (coordsArray.length !== 3 || coordsArray.some(isNaN)) {
      throw new Error("Invalid coordinate format");
    }
  } catch (error) {
    console.error("Error parsing coordinates:", error);
    return;
  }

  const shapePosition = new THREE.Vector3(
    coordsArray[0],
    coordsArray[1],
    coordsArray[2]
  );

  // Find the shape in the shapeList based on its coordinates
  const shape = shapes.find(
    (s) =>
      s.position.x == coordsArray[0] &&
      s.position.y == coordsArray[1] &&
      s.position.z == coordsArray[2]
  );

  if (!shape) {
    console.log("Shape not found in shapes.");
    return;
  }

  // Handle selection and deselection of shapes
  const existingLine = scene.getObjectByName("selection-line");

  if (existingLine && existingLine.position.equals(shapePosition)) {
    scene.remove(existingLine);
    console.log("Deselected the shape.");
    return;
  }

  // Remove existing selection line
  if (existingLine) {
    scene.remove(existingLine);
  }

  // Create a new selection line
  const geometry = new THREE.SphereGeometry(1, 32, 16);
  const edges = new THREE.EdgesGeometry(geometry);
  const line = new THREE.LineSegments(
    edges,
    new THREE.LineBasicMaterial({ color: 0xffffff })
  );
  line.position.set(shapePosition.x, shapePosition.y, shapePosition.z);
  line.name = "selection-line"; // Add a name for easy identification
  scene.add(line);
  console.log("Selection line created at shape's position.");

  // Get delete and edit buttons
  const deleteButton = document.getElementById("delete-shape-btn");
  const editButton = document.getElementById("edit-shape-btn");

  // Clear previous event listeners before setting them again
  deleteButton.onclick = () => handleDelete(shape, line, coordsArray);
  editButton.onclick = () => handleEdit(shape, line, coordsArray);
}

function handleDelete(shape, line, coordsArray) {
  // Remove the selected shape and line from the scene
  shapeList = shapeList.filter(
    (s) =>
      !(s.x == coordsArray[0] && s.y == coordsArray[1] && s.z == coordsArray[2])
  );

  shapes = shapes.filter(
    (s) =>
      !(
        s.position.x == coordsArray[0] &&
        s.position.y == coordsArray[1] &&
        s.position.z == coordsArray[2]
      )
  );
  scene.remove(line);
  scene.remove(shape);

  // Remove the shape from the shapeList based on coordinates

  updateShapeList(shapeList);
  console.log(`Shape deleted.`);
}

function handleEdit(shape, line, coordsArray) {
  const editModal = document.getElementById("edit-modal");
  editModal.style.display = "block";

  // Fill the modal fields with the current values of the shape
  const shapeTypeSelect = document.querySelector("select");
  document.getElementById("x").value = shape.position.x;
  document.getElementById("y").value = shape.position.y;
  document.getElementById("z").value = shape.position.z;
  shapeTypeSelect.value = shape.name; // Assuming shape.name holds the current shape type

  // Use a single event listener to handle edit confirmation
  const modalEditButton = document.querySelector(".edit-button");

  // Remove any previous listener to avoid duplication
  modalEditButton.removeEventListener("click", handleEditConfirmation);

  // Add the event listener
  modalEditButton.addEventListener("click", handleEditConfirmation);

  function handleEditConfirmation() {
    // Get new coordinates from the modal inputs
    const xcoord = parseFloat(document.getElementById("x").value);
    const ycoord = parseFloat(document.getElementById("y").value);
    const zcoord = parseFloat(document.getElementById("z").value);
    const shapeType = shapeTypeSelect.value;

    // Validate the new coordinates
    if (isNaN(xcoord) || isNaN(ycoord) || isNaN(zcoord)) {
      console.error("Invalid coordinate input");
      return;
    }

    // Remove the current shape and selection line from the scene
    scene.remove(line); // Remove selection line
    scene.remove(shape); // Remove the shape from the scene

    // Remove the current shape from shapeList
    shapeList = shapeList.filter(
      (s) =>
        !(
          s.x == coordsArray[0] &&
          s.y == coordsArray[1] &&
          s.z == coordsArray[2]
        )
    );

    shapes = shapes.filter(
      (s) =>
        !(
          s.position.x == coordsArray[0] &&
          s.position.y == coordsArray[1] &&
          s.position.z == coordsArray[2]
        )
    );

    // Create a new shape based on the selected type
    const createShape = {
      Cube: createCube,
      Tetrahedron: createTetrahedron,
      Octahedron: createOctahedron,
      Dodecahedron: createDodecahedron,
    }[shapeType];

    if (createShape) {
      createShape(
        xcoord,
        ycoord,
        zcoord,
        shapes,
        shapeList,
        shapeCount,
        scene,
        point,
        shapeVertex,
        dragX,
        dragY,
        dragz
      );
    } else {
      console.error("Invalid shape type");
      return;
    }

    // Update shapeList and the UI
    noOfShapes++;
    updateShapeList(shapeList);

    // Close the modal after saving the shape
    editModal.style.display = "none";

    // After edit confirmation, remove the event listener to avoid duplication on next clicks
    modalEditButton.removeEventListener("click", handleEditConfirmation);
  }
}

let buttons = document.getElementsByTagName("button");
const size = 50;
const divisions = 25;

document.getElementById("add-shape-btn").onclick = function () {
  addModal.style.display = "block";

  // First, remove any existing event listener before adding a new one
  modalbutton2.removeEventListener("click", handleShapeAddition);

  // Add the event listener for the modal button
  modalbutton2.addEventListener("click", handleShapeAddition);
};

// Function to handle shape addition
function handleShapeAddition() {
  let xcoord = document.getElementById("x1").value;
  let ycoord = document.getElementById("y1").value;
  let zcoord = document.getElementById("z1").value;
  noOfShapes++;

  const shapeType = document.getElementById("shape-add-dropdown").value;

  if (shapeType === "Cube") {
    createCube(
      xcoord,
      ycoord,
      zcoord,
      shapes,
      shapeList,
      shapeCount,
      scene,
      point,
      shapeVertex,
      dragX,
      dragY,
      dragz
    );
  } else if (shapeType === "Tetrahedron") {
    createTetrahedron(
      xcoord,
      ycoord,
      zcoord,
      shapes,
      shapeList,
      shapeCount,
      scene,
      point,
      shapeVertex,
      dragX,
      dragY,
      dragz
    );
  } else if (shapeType === "Octahedron") {
    createOctahedron(
      xcoord,
      ycoord,
      zcoord,
      shapes,
      shapeList,
      shapeCount,
      scene,
      point,
      shapeVertex,
      dragX,
      dragY,
      dragz
    );
  } else if (shapeType === "Dodecahedron") {
    createDodecahedron(
      xcoord,
      ycoord,
      zcoord,
      shapes,
      shapeList,
      shapeCount,
      scene,
      point,
      shapeVertex,
      dragX,
      dragY,
      dragz
    );
  }
  updateShapeList(shapeList); // Update the UI
  addModal.style.display = "none";
}

let raycaster = new THREE.Raycaster();
let mouse = new THREE.Vector2();
let plane = new THREE.Plane();
let pNormal = new THREE.Vector3(0, 1, 0);
let planeIntersect = new THREE.Vector3();
let pIntersect = new THREE.Vector3();
let shift = new THREE.Vector3();
let isDragging = false;
let dragObject;
let point = [];
let shapeVertex = [];
let dotList = [];
let noOfShapes = 0;

spanEditModal.onclick = function () {
  modalEdit.style.display = "none";
};

// document.addEventListener("pointermove", (event) => {
//     const rect = renderer.domElement.getBoundingClientRect();
//     const x = event.clientX - rect.left;
//     const y = event.clientY - rect.top;

//     mouse.x = (x / container.clientWidth) * 2 - 1;
//     mouse.y = (y / container.clientHeight) * -2 + 1;
//     if (mouse.x < 1 && mouse.x > -1 && mouse.y < 1 && mouse.y > -1) {
//         raycaster.setFromCamera(mouse, camera);
//         if (isDragging && lock === 0) {
//             for (let i = 0; i < shapes.length; i++) {
//                 raycaster.ray.intersectPlane(plane, planeIntersect);
//                 shapes[i].geometry.vertices[0].set(
//                     planeIntersect.x + shift.x,
//                     planeIntersect.y + shift.y,
//                     planeIntersect.z + shift.z
//                 );
//                 shapes[i].geometry.verticesNeedUpdate = true;
//                 shapeVertex[i].position.set(
//                     planeIntersect.x + shift.x - dragX[i],
//                     planeIntersect.y + shift.y - dragY[i],
//                     planeIntersect.z + shift.z - dragZ[i]
//                 );
//             }
//             raycaster.ray.intersectPlane(plane, planeIntersect);
//         } else if (isDragging) {
//             raycaster.ray.intersectPlane(plane, planeIntersect);
//         }
//     }
// });
// document.addEventListener("pointerdown", () => {
//     switch (event.which) {
//         case 1:
//             const rect = renderer.domElement.getBoundingClientRect();
//             const x = event.clientX - rect.left;
//             const y = event.clientY - rect.top;

//             mouse.x = (x / container.clientWidth) * 2 - 1;
//             mouse.y = (y / container.clientHeight) * -2 + 1;
//             pNormal.copy(camera.position).normalize();
//             plane.setFromNormalAndCoplanarPoint(pNormal, scene.position);
//             raycaster.setFromCamera(mouse, camera);
//             raycaster.ray.intersectPlane(plane, planeIntersect);
//             let position = new THREE.Vector3(
//                 shapeVertex[0].position.x,
//                 shapeVertex[0].position.y,
//                 shapeVertex[0].position.z
//             );
//             shift.subVectors(position, planeIntersect);
//             isDragging = true;
//             dragObject = shapes[shapes.length - 1];
//             break;
//     }
// });
// document.addEventListener("pointerup", () => {
//     isDragging = false;
//     dragObject = null;
// });

let vectorArrow; // Global reference for the arrow
moveButton.addEventListener("click", () => {
  let x = parseFloat(document.getElementById("quantityx").value);
  let y = parseFloat(document.getElementById("quantityy").value);
  let z = parseFloat(document.getElementById("quantityz").value);

  // Create a translation matrix to move the point
  let translate_M = new THREE.Matrix4();
  translate_M.makeTranslation(
    x - dotList[0].geometry.getAttribute("position").array[0],
    y - dotList[0].geometry.getAttribute("position").array[1],
    z - dotList[0].geometry.getAttribute("position").array[2]
  );

  // Apply translation to the point's geometry
  dotList[0].geometry.applyMatrix4(translate_M);
  dotList[0].geometry.verticesNeedUpdate = true;

  // Update the transformation matrix
  trans_matrix.multiply(translate_M);

  // Update initial position for future reference
  initial_pos[0] = x;
  initial_pos[1] = y;
  initial_pos[2] = z;

  // Draw the updated vector arrow from the origin to the new point
  let position = dotList[0].geometry.getAttribute("position").array;
  let origin = new THREE.Vector3(0, 0, 0);
  let endPoint = new THREE.Vector3(position[0], position[1], position[2]);
  let direction = new THREE.Vector3().subVectors(endPoint, origin).normalize();
  let length = endPoint.distanceTo(origin);

  if (vectorArrow) {
    // Remove the old arrow if it exists
    scene.remove(vectorArrow);
  }

  // Create a new arrow helper and add it to the scene
  vectorArrow = new THREE.ArrowHelper(direction, origin, length, 0xff0000);
  scene.add(vectorArrow); // Add the new arrow to the scene
});

function movePoint(e) {
  var target = e.target ? e.target : e.srcElement;
  let rot_angle =
    (target.value * parseFloat(document.getElementById("theta").value)) /
      target.max -
    present_theta;

  let quat = new THREE.Quaternion();
  let rot_matrix = new THREE.Matrix4();
  quat.setFromAxisAngle(rot_axis, (rot_angle * Math.PI) / 180);
  rot_matrix.makeRotationFromQuaternion(quat);

  // --- Handle Dot Rotation ---
  dotList[0].geometry.applyMatrix4(rot_matrix);
  dotList[0].geometry.verticesNeedUpdate = true;

  // --- Handle Shapes Rotation ---
  for (let i = 0; i < shapes.length; i++) {
    // Translate the shape's geometry
    shapes[i].geometry.applyMatrix4(rot_matrix);

    // Update geometry (handle BufferGeometry and Geometry)
    if (shapes[i].geometry.isBufferGeometry) {
      shapes[i].geometry.attributes.position.needsUpdate = true;
      shapes[i].geometry.computeBoundingBox();
      shapes[i].geometry.computeVertexNormals();
    } else {
      shapes[i].geometry.verticesNeedUpdate = true;
    }

    // Apply translation to the edges' geometry
    shapes[i].traverse((child) => {
      if (child.isLineSegments) {
        // More robust way to identify edges
        child.geometry.applyMatrix4(rot_matrix);

        // Update edge geometry (handle BufferGeometry and Geometry)
        if (child.geometry.isBufferGeometry) {
          child.geometry.attributes.position.needsUpdate = true;
          child.geometry.computeBoundingBox();
        } else {
          child.geometry.verticesNeedUpdate = true;
        }
      }
    });
  }

  // Apply the rotation matrix to the transformation matrix
  trans_matrix.multiply(rot_matrix);

  // Get the position of the first dot and update the display for the dot
  let position = dotList[0].geometry.getAttribute("position").array;
  document.getElementById("quantityx").value = position[0];
  document.getElementById("quantityy").value = position[1];
  document.getElementById("quantityz").value = position[2];

  // Update the transformation matrix in the UI
  if (target.value <= 0) {
    trans_matrix.set(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1);
  }

  document.getElementById("matrix-00").value = trans_matrix.elements[0];
  document.getElementById("matrix-01").value = trans_matrix.elements[1];
  document.getElementById("matrix-02").value = trans_matrix.elements[2];
  document.getElementById("matrix-03").value = trans_matrix.elements[3];

  document.getElementById("matrix-10").value = trans_matrix.elements[4];
  document.getElementById("matrix-11").value = trans_matrix.elements[5];
  document.getElementById("matrix-12").value = trans_matrix.elements[6];
  document.getElementById("matrix-13").value = trans_matrix.elements[7];

  document.getElementById("matrix-20").value = trans_matrix.elements[8];
  document.getElementById("matrix-21").value = trans_matrix.elements[9];
  document.getElementById("matrix-22").value = trans_matrix.elements[10];
  document.getElementById("matrix-23").value = trans_matrix.elements[11];

  document.getElementById("matrix-30").value = trans_matrix.elements[12];
  document.getElementById("matrix-31").value = trans_matrix.elements[13];
  document.getElementById("matrix-32").value = trans_matrix.elements[14];
  document.getElementById("matrix-33").value = trans_matrix.elements[15];

  // --- Draw Vector Arrow for the first dot ---
  let origin = new THREE.Vector3(0, 0, 0);
  let endPoint = new THREE.Vector3(position[0], position[1], position[2]);
  let direction = new THREE.Vector3().subVectors(endPoint, origin).normalize();
  let length = endPoint.distanceTo(origin);

  if (vectorArrow) {
    // Remove the old arrow if it exists
    scene.remove(vectorArrow);
  }

  // Create the new vector arrow for the first dot
  vectorArrow = new THREE.ArrowHelper(direction, origin, length, 0xab53b2);
  scene.add(vectorArrow); // Add the new arrow to the scene

  // Update the present_theta (global rotation angle)
  present_theta += rot_angle;
}

document.getElementById("frames").onchange = function () {
  let new_value = document.getElementById("frames").value; // New value for frames
  let target = document.getElementById("slider");
  let rot_angle =
    (target.value * parseFloat(document.getElementById("theta").value)) /
      new_value -
    present_theta;

  let quat = new THREE.Quaternion();
  let rot_matrix = new THREE.Matrix4();
  quat.setFromAxisAngle(rot_axis, (rot_angle * PI) / 180);
  rot_matrix.makeRotationFromQuaternion(quat);

  // Apply the rotation matrix to the point's geometry
  dotList[0].geometry.applyMatrix4(rot_matrix);
  dotList[0].geometry.verticesNeedUpdate = true;

  // Multiply the transformation matrix
  trans_matrix.multiply(rot_matrix);

  // Update the position fields (quantityx, quantityy, quantityz)
  document.getElementById("quantityx").value =
    dotList[0].geometry.getAttribute("position").array[0];
  document.getElementById("quantityy").value =
    dotList[0].geometry.getAttribute("position").array[1];
  document.getElementById("quantityz").value =
    dotList[0].geometry.getAttribute("position").array[2];

  // Reset the transformation matrix if the target value is less than or equal to 0
  if (target.value <= 0) {
    trans_matrix.set(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1);
  }

  // Update the matrix values in the UI
  document.getElementById("matrix-00").value = trans_matrix.elements[0];
  document.getElementById("matrix-01").value = trans_matrix.elements[1];
  document.getElementById("matrix-02").value = trans_matrix.elements[2];
  document.getElementById("matrix-03").value = trans_matrix.elements[3];
  document.getElementById("matrix-10").value = trans_matrix.elements[4];
  document.getElementById("matrix-11").value = trans_matrix.elements[5];
  document.getElementById("matrix-12").value = trans_matrix.elements[6];
  document.getElementById("matrix-13").value = trans_matrix.elements[7];
  document.getElementById("matrix-20").value = trans_matrix.elements[8];
  document.getElementById("matrix-21").value = trans_matrix.elements[9];
  document.getElementById("matrix-22").value = trans_matrix.elements[10];
  document.getElementById("matrix-23").value = trans_matrix.elements[11];
  document.getElementById("matrix-30").value = trans_matrix.elements[12];
  document.getElementById("matrix-31").value = trans_matrix.elements[13];
  document.getElementById("matrix-32").value = trans_matrix.elements[14];
  document.getElementById("matrix-33").value = trans_matrix.elements[15];

  // Update present_theta
  present_theta += rot_angle;

  // Update the slider max value
  document.getElementById("slider").max = new_value;

  // Recalculate the vector for the updated point
  let position = dotList[0].geometry.getAttribute("position").array;
  let origin = new THREE.Vector3(0, 0, 0); // Origin at (0, 0, 0)
  let endPoint = new THREE.Vector3(position[0], position[1], position[2]); // New point position
  let direction = new THREE.Vector3().subVectors(endPoint, origin).normalize(); // Direction from origin to point
  let length = endPoint.distanceTo(origin); // Length of the arrow (distance from origin to point)

  // Remove the old arrow if it exists
  if (vectorArrow) {
    scene.remove(vectorArrow);
  }

  // Create and add the new arrow based on the updated point
  vectorArrow = new THREE.ArrowHelper(direction, origin, length, 0xff0000); // Red color
  scene.add(vectorArrow); // Add the new arrow to the scene
};

document.getElementById("theta").onchange = function () {
  let old_sli_val = document.getElementById("slider").value;
  let new_tot_angle = document.getElementById("theta").value;
  let new_theta = present_theta * (new_tot_angle / total_angle);

  if (new_theta > total_angle) new_theta = total_angle;

  let quat = new THREE.Quaternion();
  let rot_matrix = new THREE.Matrix4();
  quat.setFromAxisAngle(rot_axis, ((new_theta - present_theta) * PI) / 180);
  rot_matrix.makeRotationFromQuaternion(quat);

  // Apply the rotation to the point's geometry
  dotList[0].geometry.applyMatrix4(rot_matrix);
  dotList[0].geometry.verticesNeedUpdate = true;

  // Update the position fields (quantityx, quantityy, quantityz)
  document.getElementById("quantityx").value =
    dotList[0].geometry.getAttribute("position").array[0];
  document.getElementById("quantityy").value =
    dotList[0].geometry.getAttribute("position").array[1];
  document.getElementById("quantityz").value =
    dotList[0].geometry.getAttribute("position").array[2];

  // Update the slider value
  document.getElementById("slider").value =
    old_sli_val * (new_tot_angle / total_angle);

  // Update the slider max and step
  total_angle = new_tot_angle;
  document.getElementById("slider").max = new_tot_angle;
  slider.step =
    (document.getElementById("slider").max -
      document.getElementById("slider").min) /
    frames;

  // Update present_theta
  present_theta = new_theta;

  // Recalculate the vector for the updated point
  let position = dotList[0].geometry.getAttribute("position").array;
  let origin = new THREE.Vector3(0, 0, 0);
  let endPoint = new THREE.Vector3(position[0], position[1], position[2]);
  let direction = new THREE.Vector3().subVectors(endPoint, origin).normalize();
  let length = endPoint.distanceTo(origin);

  // Remove the old arrow if it exists
  if (vectorArrow) {
    scene.remove(vectorArrow);
  }

  // Create and add the new arrow based on the updated point
  vectorArrow = new THREE.ArrowHelper(direction, origin, length, 0xff0000); // Red color
  scene.add(vectorArrow); // Add the new arrow to the scene
};

set_rotation_axis.addEventListener("click", () => {
  if (document.getElementById("axis-change-dropdown").value == 0) {
    xcomp = 1;
    ycomp = 0;
    zcomp = 0;
  }
  if (document.getElementById("axis-change-dropdown").value == 1) {
    ycomp = 1;
    xcomp = 0;
    zcomp = 0;
  }
  if (document.getElementById("axis-change-dropdown").value == 2) {
    zcomp = 1;
    xcomp = 0;
    ycomp = 0;
  }

  rot_axis = new THREE.Vector3(
    parseFloat(xcomp),
    parseFloat(ycomp),
    parseFloat(zcomp)
  );
});


function createLabel(text, direction, length) {
  const fontLoader = new THREE.FontLoader();
  let labelMesh;

  fontLoader.load(
    "https://threejs.org/examples/fonts/helvetiker_regular.typeface.json",
    function (font) {
      const geometry = new THREE.TextGeometry(text, {
        font: font,
        size: 0.6,
        height: 0.1,
      });
      const material = new THREE.MeshBasicMaterial({ color: 0xffffff });
      labelMesh = new THREE.Mesh(geometry, material);

      // Position the label at the end of the arrow (tip of the arrow)
      const labelPosition = direction.clone().multiplyScalar(length);
      labelMesh.position.copy(labelPosition);
      scene.add(labelMesh);
    }
  );

  return labelMesh;
}

const toggleInstructions = document.getElementById("toggle-instructions");
const procedureMessage = document.getElementById("procedure-message");

// Function to show the instructions overlay
const showInstructions = () => {
  procedureMessage.style.display = "block";
};

// Function to hide the instructions overlay
const hideInstructions = (event) => {
  // Close if click is outside the overlay or if it's the toggle button again
  if (
    !procedureMessage.contains(event.target) &&
    event.target !== toggleInstructions
  ) {
    procedureMessage.style.display = "none";
  }
};

// Attach event listeners
toggleInstructions.addEventListener("click", (event) => {
  // Toggle the visibility of the overlay
  if (procedureMessage.style.display === "block") {
    procedureMessage.style.display = "none";
  } else {
    showInstructions();
  }
  event.stopPropagation(); // Prevent immediate closure after clicking the button
});

document.addEventListener("click", hideInstructions);

// Prevent closing the overlay when clicking inside it
procedureMessage.addEventListener("click", (event) => {
  event.stopPropagation(); // Prevent the click inside from closing the overlay
});



scene = new THREE.Scene();
scene.background = new THREE.Color(0x333333);
camera = new THREE.PerspectiveCamera(
  30,
  window.innerWidth / window.innerHeight,
  1,
  1000
);

let init = function () {
  camera.position.set(20, 20, 20); // Set camera position behind and above the origin

  camera.lookAt(10, 10, 5);
  const light = new THREE.DirectionalLight(0xffffff, 3);
  light.position.set(1, 1, 1).normalize();
  scene.add(light);
  const gridHelper = new THREE.GridHelper(size, divisions);
  const count = 1;
  let dir_x = new THREE.Vector3(1, 0, 0);
  let dir_y = new THREE.Vector3(0, 1, 0);
  let dir_z = new THREE.Vector3(0, 0, 1);
  let negdir_x = new THREE.Vector3(-1, 0, 0);
  let negdir_y = new THREE.Vector3(0, -1, 0);
  let negdir_z = new THREE.Vector3(0, 0, -1);

  const origin = new THREE.Vector3(0, 0, 0);
  let endPoint = new THREE.Vector3(
    initial_pos[0],
    initial_pos[1],
    initial_pos[2]
  );

  const length = 10;
 const arrowHelper = [];
 const dir = [
   new THREE.Vector3(1, 0, 0), // +X
   new THREE.Vector3(0, 1, 0), // +Y
   new THREE.Vector3(0, 0, 1), // +Z
   new THREE.Vector3(-1, 0, 0), // -X
   new THREE.Vector3(0, -1, 0), // -Y
   new THREE.Vector3(0, 0, -1), // -Z
 ];

 const labels = ["+X", "+Y", "+Z", "-X", "-Y", "-Z"]; // Labels for each axis


 // Loop through the axes
 for (let i = 0; i < 6; i++) {
   // Determine color based on the direction
   let color;
   if (i === 0 || i === 3) {
     color = "red"; // +X and -X axes
   } else if (i === 1 || i === 4) {
     color = "yellow"; // +Y and -Y axes
   } else {
     color = "blue"; // +Z and -Z axes
   }

   // Create the arrow helper for the current direction and color
   arrowHelper[i] = new THREE.ArrowHelper(dir[i], origin, length, color);
   scene.add(arrowHelper[i]);

   // Create label for each axis and position it at the tip of the arrow
   const label = createLabel(labels[i], dir[i], length);
   scene.add(label);
 }
  let direction = new THREE.Vector3().subVectors(endPoint, origin).normalize();

  vectorArrow = new THREE.ArrowHelper(
    direction,
    origin,
    endPoint.distanceTo(origin),
    0xab53b2
  );
  scene.add(vectorArrow); // Add the new arrow to the scene

  createCube(
    5,
    1,
    0,
    shapes,
    shapeList,
    shapeCount,
    scene,
    point,
    shapeVertex,
    dragX,
    dragY,
    dragz
  );

  createTetrahedron(
    4,
    5,
    2,
    shapes,
    shapeList,
    shapeCount,
    scene,
    point,
    shapeVertex,
    dragX,
    dragY,
    dragz
  );
  updateShapeList(shapeList); // Update the UI

  let PointGeometry = dot(scene, dotList, initial_pos);
  renderer = new THREE.WebGLRenderer();
  let w = container.offsetWidth;
  let h = container.offsetHeight;
  renderer.setSize(w, 0.85* h);
  container.appendChild(renderer.domElement);
  orbit = new OrbitControls(camera, renderer.domElement);
  orbit.mouseButtons = {
    LEFT: MOUSE.PAN,
    MIDDLE: MOUSE.DOLLY,
    RIGHT: MOUSE.ROTATE,
  };
  orbit.target.set(0, 0, 0);
  orbit.enableDamping = true;
};
let mainLoop = function () {
  orbit.update(); // Important for damping
  camera.updateMatrixWorld();
  renderer.render(scene, camera);
  requestAnimationFrame(mainLoop);
};
init();
mainLoop();
