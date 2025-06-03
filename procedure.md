# Procedure

## Step 1: Familiarize with Interface Controls

- **Mouse and Touch Controls**: 
  - Left-click and drag to pan the view
  - Right-click and drag to rotate the view
  - Scroll to zoom in/out
  - On mobile, use touch gestures for the same actions

## Step 2: Utilize Lock Options

- **Lock Controls**: Use the checkboxes to restrict specific functionalities:
  - Lock Vertices: Prevents panning with left mouse button
  - Lock Zoom: Disables zooming with scroll wheel
  - Lock Rotate: Prevents view rotation with right mouse button

## Step 3: Manage Shape Controls

- **Shape Manipulation**:
  1. **Adding Shapes**: Click "Add Shape" button, select shape type and coordinates, then click "Add"
  2. **Selecting Shapes**: Click "Select" button next to a shape in the list
     - A white circle will appear around the selected shape
     - The shape's coordinates will be displayed in the input fields
  3. **Moving Shapes**: 
     - Select a shape first
     - Enter new coordinates in the input fields
     - Click "MOVE" button to reposition the shape
  4. **Editing Shapes**: 
     - Select a shape first
     - Click "Edit" button
     - Modify shape type or coordinates
     - Click "Edit" to apply changes
  5. **Deleting Shapes**: Select a shape and click "Delete" button

## Step 4: Explore Grid and Rotation Controls

- **Grid Visualization**: 
  - Use checkboxes to toggle different grid planes:
    - XY-grid: Shows horizontal plane
    - YZ-grid: Shows vertical plane
    - XZ-grid: Shows depth plane
  - Grids help visualize the 3D space and shape positions

- **Rotation Controls**:
  1. **Select Rotation Axis**:
     - Choose X, Y, or Z axis from the dropdown
     - Click "Change Axis" button
     - A purple arrow will appear showing the selected rotation axis
  2. **Apply Rotation**:
     - Select a shape first (white circle appears)
     - Move the slider to rotate the shape
     - The white circle will disappear during rotation
     - The shape rotates around the selected axis
     - The white circle reappears when you release the slider
  3. **Observe Results**:
     - Watch how the shape rotates around the chosen axis
     - The transformation matrix updates to show the rotation
     - The shape maintains its position while rotating
     - The purple arrow indicates the axis of rotation

## Step 5: Best Practices and Tips

- **Before Rotation**:
  - Always select a shape first
  - Choose the desired rotation axis
  - Ensure the purple arrow shows the correct axis
  - Start with small slider movements to observe the effect

- **During Rotation**:
  - The white selection circle will disappear to show the rotation clearly
  - The shape rotates around its current position
  - The transformation matrix updates in real-time

- **After Rotation**:
  - The white selection circle reappears
  - The shape maintains its new orientation
  - You can continue rotating or select a different axis

- **Troubleshooting**:
  - If a shape doesn't rotate, ensure it's selected first
  - If rotation seems incorrect, verify the purple arrow shows the intended axis
  - If the view becomes unclear, use the mouse controls to adjust your perspective

By following these steps, you can effectively manipulate and transform 3D shapes while observing how rotations affect their orientation in space. The visual feedback (white circle, purple arrow) helps understand the current state and operations being performed.
