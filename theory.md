Rotation transformation rotates points about an axis through the origin. Rotation about the co-ordinate axes X, Y and Z is a standard operation, which is used often in graphics applications.  

Rotation is performed by multiplying the point with a Rotation Matrix. There are specific matrices for rotations about X, Y and Z axes.  

<img src="images/rotation-matrix.png">  

Rotation Matrix  

Rotations can also be performed about an arbitrary axis. This can be done in the following manner:  

  1. Rotate the arbitrary axis about one of the co-ordinate axes, say Y, to align it to one of the co-ordinate planes, say XY.  
  2. Rotate this axis about the Z axis to align it to the Y axis.  
  3. Perform the required rotation about the Y axis using RY.  
  4. Reverse the steps 2 and 1 to put the axis back in its original alignment.

Rotation matrices rotate all points about an axis passing through the origin. In order to rotate about a particular point, the point must be translated to origin first. Once the rotation is performed, the point must be translated back to its original location.  
Thus the matrix for rotating about a particular point is:  
M = T<sub>-1</sub>RT
where T translates the point to origin and R is the rotation matrix.  

It is important to know the frame of reference when considering rotations, as all rotations are described relative to a particular frame of reference. In general for any orthogonal transformation on a body in a coordinate system there is an inverse transformation which if applied to the frame of reference results in the body being at the same coordinates. For example in two dimensions rotating a body clockwise about a point keeping the axes fixed is equivalent to rotating the axes counterclockwise about the same point while the body is kept fixed. Thus, a rotation of 45<sup>&deg;</sup> about Z-axis is equivalent to rotating the coordinate system by -45<sup>&deg;</sup> about the Z-axis.  
