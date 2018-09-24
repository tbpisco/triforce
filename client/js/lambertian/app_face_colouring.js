var App = (function() {

	var self;

	function App(){

		self = this;
		self.time = Date.now();
		self.fps = 30;
		init();
		
    }

	var init = function(){

		createCanvas();
		self.gl = webglUtils.getGLContext(self.canvas);

		self.mvMatrix = mat4.create();
  		self.pMatrix  = mat4.create(); 
		self.nMatrix  = mat4.create();
		self.mvMatrixStack = [];

  		self.prg = createShaderProgram(self.gl);

  		self.degreeX = 0;
		self.degreeY = 0;

  		setupUniformAndAttributes(self.prg, self.gl); 

  		self.vertices = setupComplexVertices(); 
  		self.indices = setupComplexIndices();
		self.normals = webglUtils.calculateNormals(self.vertices, self.indices);
		self.colours = setupComplexColours();

		var invertVertices = [1,2,3, 4,5,6, 7,8,9, 10,11,12, 13,14,15, 16,17,18];
		for (var x = 0; x < invertVertices.length; x++){
			self.normals[(3*invertVertices[x])-1] *= -1;
		}

		var invertVertices = [ 19,20,21,22, 23,24,25,26,  35,36,37,38, 39,40,41,42];
		for (var x = 0; x < invertVertices.length; x++){
			self.normals[(3*invertVertices[x])-3] *= -1;
			self.normals[(3*invertVertices[x])-2] *= -1;
			self.normals[(3*invertVertices[x])-1] *= -1;
		}

		var invertVertices = [ 27,28,29,30, 31,32,33,34 ];
		for (var x = 0; x < invertVertices.length; x++){
			self.normals[(3*invertVertices[x])-2] *= -1;
			self.normals[(3*invertVertices[x])-1] *= -1;
		}
		  
		createNormalsLinesBuffer(self.vertices, self.normals);

		self.VBOBuffer = self.gl.createBuffer();
		self.gl.bindBuffer(self.gl.ARRAY_BUFFER, self.VBOBuffer);
		self.gl.bufferData(self.gl.ARRAY_BUFFER, new Float32Array(self.vertices), self.gl.STATIC_DRAW);

		self.NormalBuffer = self.gl.createBuffer();
		self.gl.bindBuffer(self.gl.ARRAY_BUFFER, self.NormalBuffer);
		self.gl.bufferData(self.gl.ARRAY_BUFFER, new Float32Array(self.normals), self.gl.STATIC_DRAW);
		
		self.ColourBuffer = self.gl.createBuffer();
		self.gl.bindBuffer(self.gl.ARRAY_BUFFER, self.ColourBuffer);
		self.gl.bufferData(self.gl.ARRAY_BUFFER, new Float32Array(self.colours), self.gl.STATIC_DRAW);
	
		self.IBOBuffer = self.gl.createBuffer();
		self.gl.bindBuffer(self.gl.ELEMENT_ARRAY_BUFFER, self.IBOBuffer);
		self.gl.bufferData(self.gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(self.indices), self.gl.STATIC_DRAW);

		self.gl.bindBuffer(self.gl.ARRAY_BUFFER, null);
		self.gl.bindBuffer(self.gl.ELEMENT_ARRAY_BUFFER, null);

		renderLoop();
  
	};

	var  createNormalsLinesBuffer = function(vertices, normals){

		var points = [];
		var size = 1;
		for(var i = 0; i < vertices.length; i +=3){
			points.push(vertices[i]);
			points.push(vertices[i+1]);
			points.push(vertices[i+2]);

			points.push(vertices[i] + normals[i]*size);
			points.push(vertices[i+1] + normals[i+1]*size);
			points.push(vertices[i+2] + normals[i+2]*size);
		}

		self.normalsVertices = points;
		self.normalVerticesBuffer = self.gl.createBuffer();
		self.gl.bindBuffer(self.gl.ARRAY_BUFFER, self.normalVerticesBuffer);
		self.gl.bufferData(self.gl.ARRAY_BUFFER, new Float32Array(self.normalsVertices), self.gl.STATIC_DRAW);

	};

	/*
  
  COMPLEX GEOMETRIC
  
  FRONT
  ---------------------------------------------------------------------------
  
                    0 (0,0.867,0)
                  /\
                 /  \
  (-0.5,0,0) 1  /____\  2 (0.5,0,0)
  
                    3 (-0.5,0,0)                          6 (0.5,0,0)
                  /\                                     /\
                 /  \                                   /  \
 (-1,-0.867,0)4 /____\ 5 (0,-0.867,0)   (0,-0.867,0) 7 /____\ 8 (1,-0.867,0)

 -----------------------------------------------------------------------------
 
 BACK
 -----------------------------------------------------------------------------
 
                     9 (0,0.867,0.5)
                    /\
                   /  \
 (-0.5,0,0.5) 10  /____\  11 (0.5,0,0.5)
  
                    12 (-0.5,0,0.5)                              15 (0.5,0,0.5)
                    /\                                           /\
                   /  \                                         /  \
(-1,-0.867,0.5)13 /____\ 14 (0,-0.867,0.5)   (0,-0.867,0.5) 16 /____\ 17 (1,-0.867,0.5)

------------------------------------------------------------------------------

EXTRENAL FACES
------------------------------------------------------------------------------
  
          (0,0.867,0.5) 18 _ 21 (0,0.867,0)
                         / /
                        / /
                       / /
                      / /
                     / /
(-1,-0.867,0.5) 19  /_/ 20 (-1,-0.867,0)


   (0,0.867,0) 22 _ 25 (0,0.867,0.5)
                 \ \      
                  \ \     
                   \ \   
                    \ \ 
                     \ \
   (1,-0.867,0) 23    \_\ 24 (1,-0.867,0.5)
   
   
    (-1,-0.867,0.5) 26  ________ 29 (1,-0.867,0.5)
                       |________|
      (-1,-0.867,0) 27           28 (1,-0.867,0)


------------------------------------------------------------------------------

INTERNAL FACES
------------------------------------------------------------------------------

       (-0.5,0,0.5) 30  ________ 33 (0.5,0,0.5)
                       |________|
         (-0.5,0,0) 31           32 (0.5,0,0)
      
 
    (-0.5,0,0) 34 _ 37 (-0.5,0,0.5)
                 \ \      
                  \ \     
                   \ \   
                    \ \ 
                     \ \
   (0,-0.867,0) 35    \_\ 36 (0,-0.867,0.5)
   
 
             (0.5,0,0.5)38 _ 41 (0.5,0,0)
                          / /
                         / /
                        / /
                       / /
                      / /
  (0,-0.867,0.5) 39  /_/ 40 (0,-0.867,0.0)

------------------------------------------------------------------------------
 
  */
  
 	var setupComplexVertices = function(){
    	return  [
				/*front*/
				0,0.867,0,
				-0.5,0,0,
				0.5,0,0,
				-0.5,0,0,
				-1,-0.867,0,
				0,-0.867,0,
				0.5,0,0,
				0,-0.867,0,
				1,-0.867,0,
				
				/*back*/
				0,0.867,0.3,
				-0.5,0,0.3,
				0.5,0,0.3,
				-0.5,0,0.3,
				-1,-0.867,0.3,
				0,-0.867,0.3,
				0.5,0,0.3,
				0,-0.867,0.3,
				1,-0.867,0.3,
				
				/*external faces*/
				0,0.867,0.3,
				-1,-0.867,0.3,
				-1,-0.867,0,
				0,0.867,0,
				0,0.867,0,
				1,-0.867,0,
				1,-0.867,0.3,
				0,0.867,0.3,
				-1,-0.867,0.3,
				-1,-0.867,0,
				1,-0.867,0,
				1,-0.867,0.3,
				
				/*internal faces*/
				-0.5,0,0.3,
				-0.5,0,0,
				0.5,0,0,
				0.5,0,0.3,
				-0.5,0,0,
				0,-0.867,0,
				0,-0.867,0.3,
				-0.5,0,0.3,
				0.5,0,0.3,
				0,-0.867,0.3,
				0,-0.867,0,
				0.5,0,0
           ]
	};
	
	var setupComplexColours = function(){
		return  [
			/*front*/
			0.0,0.8,0.8,1.0,
			0.0,0.8,0.8,1.0,
			0.0,0.8,0.8,1.0,
			0.0,0.8,0.8,1.0,
			0.0,0.8,0.8,1.0,
			0.0,0.8,0.8,1.0,
			0.2,0.3,0.9,1.0,
			0.2,0.3,0.9,1.0,
			0.2,0.3,0.9,1.0,
			
			/*back*/
			0.0,0.8,0.8,1.0,
			0.0,0.8,0.8,1.0,
			0.0,0.8,0.8,1.0,
			0.8,0.8,0.0,1.0,
			0.8,0.8,0.0,1.0,
			0.8,0.8,0.0,1.0,
			0.2,0.3,0.9,1.0,
			0.2,0.3,0.9,1.0,
			0.2,0.3,0.9,1.0,
			
			/*external faces*/
			0.8,0.8,0.0,1.0,
			0.8,0.8,0.0,1.0,
			0.8,0.8,0.0,1.0,
			0.8,0.8,0.0,1.0,
			0.8,0.8,0.0,1.0,
			0.8,0.8,0.0,1.0,
			0.8,0.8,0.0,1.0,
			0.8,0.8,0.0,1.0,
			0.8,0.8,0.0,1.0,
			0.8,0.8,0.0,1.0,
			0.8,0.8,0.0,1.0,
			0.8,0.8,0.0,1.0,
			
			/*internal faces*/
			0.8,0.8,0.0,1.0,
			0.8,0.8,0.0,1.0,
			0.8,0.8,0.0,1.0,
			0.8,0.8,0.0,1.0,
			0.8,0.8,0.0,1.0,
			0.8,0.8,0.0,1.0,
			0.8,0.8,0.0,1.0,
			0.8,0.8,0.0,1.0,
			0.8,0.8,0.0,1.0,
			0.8,0.8,0.0,1.0,
			0.8,0.8,0.0,1.0,
			0.8,0.8,0.0,1.0
	   ]
	};
  
    var setupComplexIndices = function(){
		return [
				/*front*/
				0,1,2,
				3,4,5,
				6,7,8,
				/*back*/
				11,10,9,
				14,13,12,
				17,16,15,
				/*external faces*/
				18,19,20,
				18,20,21,
				22,23,24,
				22,24,25,
				26,29,27,
				29,28,27,
				/*internal faces*/
				30,33,31,
				31,33,32,
				34,35,36,
				34,36,37,
				38,39,40,
				38,40,41
		]
    };

	var setupUniformAndAttributes = function(prg,gl){

	  prg.aVertexPosition  	= gl.getAttribLocation(prg, "aVertexPosition");
	  prg.aVertexNormal    	= gl.getAttribLocation(prg, "aVertexNormal");
	  prg.aVertexColor		= gl.getAttribLocation(prg, "aVertexColor");

	  prg.uPMatrix   	   	= gl.getUniformLocation(prg, "uPMatrix");
	  prg.uMVMatrix  	   	= gl.getUniformLocation(prg, "uMVMatrix");
	  prg.uNMatrix         	= gl.getUniformLocation(prg, "uNMatrix");

      prg.uMaterialDiffuse 	= gl.getUniformLocation(prg, "uMaterialDiffuse");
      prg.uLightDiffuse     = gl.getUniformLocation(prg, "uLightDiffuse");    
      prg.uLightDirection   = gl.getUniformLocation(prg, "uLightDirection");

	  gl.uniform3fv(prg.uLightDirection,  [-5.0,0.0,-10.0]);
      gl.uniform4fv(prg.uLightDiffuse,  [1.0,1.0,1.0,1.0]); 
      gl.uniform4fv(prg.uMaterialDiffuse, [0.8, 0.8, 0.0,1.0]);

	};

	var createCanvas = function(){
		
		self.canvas = document.createElement("canvas");
		self.canvas.id = 'webgl-canvas';
		document.getElementsByTagName('body')[0].appendChild(self.canvas);

		self.canvas.width = window.innerWidth;
		self.canvas.height = window.innerHeight;

		window.addEventListener("resize", function(){
			self.canvas.width = window.innerWidth;
			self.canvas.height = window.innerHeight;
		}.bind(this));

	};

	var createShaderProgram = function(gl){

	  var prg = gl.createProgram();
	  
	  var fgShader = webglUtils.getShader(gl, "shader-fs");
	  var vxShader = webglUtils.getShader(gl, "shader-vs");
	  
	  gl.attachShader(prg, vxShader);
	  gl.attachShader(prg, fgShader);
	  gl.linkProgram(prg);

	  if (!gl.getProgramParameter(prg, gl.LINK_STATUS)) {
	    alert("Could not initialise shaders");
	  }

	  gl.useProgram(prg);
	  
	  return prg;
	};

	var draw = function(){

		self.degreeY++;
	    self.degreeY = self.degreeY % 360;
	  
	    self.degreeX++;
	    self.degreeX = self.degreeX % 360;

		self.gl.clearColor(0.2, 0.3, 0.6, 1.0);
		self.gl.clearDepth(1.0);
    
		//Enables depth testing
		self.gl.enable(self.gl.DEPTH_TEST);
		self.gl.depthFunc(self.gl.LESS);
		self.gl.blendEquation(self.gl.FUNC_ADD);
		//Enables blending
		self.gl.enable(self.gl.BLEND);

		//Blending function for transparencies
		self.gl.blendFunc(self.gl.SRC_ALPHA, self.gl.ONE_MINUS_SRC_ALPHA);   
		//self.gl.blendFunc(self.gl.DST_COLOR, self.gl.ONE_MINUS_SRC_ALPHA);
		//Enable culling
		self.gl.enable(self.gl.CULL_FACE);

		self.gl.clear(self.gl.COLOR_BUFFER_BIT | self.gl.DEPTH_BUFFER_BIT);
		self.gl.viewport(0,0,self.canvas.width, self.canvas.height);	    
		mat4.perspective(30, self.canvas.width / self.canvas.height, 0.1, 10000.0, self.pMatrix);

		renderObject(false);
		renderObject(true);
		//renderObjectNormal();
		
	};

	var renderObject = function(backFaceCulling){


		self.gl.enableVertexAttribArray(self.prg.aVertexPosition);
		self.gl.enableVertexAttribArray(self.prg.aVertexNormal);

		mat4.identity(self.mvMatrix);
		mat4.translate(self.mvMatrix, [0.0, 0.0, -10.0]); 
		mat4.rotate(self.mvMatrix, self.degreeY * Math.PI/180, [0,1,0]);
		mat4.rotate(self.mvMatrix, self.degreeX * Math.PI/180, [1,0,0]);
		
		self.gl.uniformMatrix4fv(self.prg.uMVMatrix, false, self.mvMatrix);
		self.gl.uniformMatrix4fv(self.prg.uPMatrix, false, self.pMatrix);

		mat4.set(self.mvMatrix, self.nMatrix);
	    mat4.inverse(self.nMatrix);
		mat4.transpose(self.nMatrix);	

		self.gl.uniformMatrix4fv(self.prg.uNMatrix, false, self.nMatrix);

		self.gl.bindBuffer(self.gl.ARRAY_BUFFER, self.VBOBuffer);
		self.gl.vertexAttribPointer(self.prg.aVertexPosition, 3, self.gl.FLOAT, false, 0, 0);
		self.gl.enableVertexAttribArray(self.prg.aVertexPosition);

		self.gl.bindBuffer(self.gl.ARRAY_BUFFER, self.NormalBuffer);
		self.gl.vertexAttribPointer(self.prg.aVertexNormal,3,self.gl.FLOAT, false, 0,0);
		self.gl.enableVertexAttribArray(self.prg.aVertexNormal);

		//self.gl.bindBuffer(self.gl.ARRAY_BUFFER, self.ColourBuffer);
		//self.gl.vertexAttribPointer(self.prg.aVertexColor,4,self.gl.FLOAT, false, 0,0);
		//self.gl.enableVertexAttribArray(self.prg.aVertexColor);
		
		self.gl.bindBuffer(self.gl.ELEMENT_ARRAY_BUFFER, self.IBOBuffer);

		if(backFaceCulling){
			self.gl.cullFace(self.gl.FRONT);
		} else {
			self.gl.cullFace(self.gl.BACK);
		}
		
		self.gl.drawElements(self.gl.TRIANGLES, self.indices.length, self.gl.UNSIGNED_SHORT, 0);		

		self.gl.bindBuffer(self.gl.ARRAY_BUFFER, null);
		self.gl.bindBuffer(self.gl.ELEMENT_ARRAY_BUFFER, null);	
	};


	var renderObjectNormal = function(){

		self.gl.enableVertexAttribArray(self.prg.aVertexPosition);
		self.gl.enableVertexAttribArray(self.prg.aVertexNormal);

		mat4.identity(self.mvMatrix);
		mat4.translate(self.mvMatrix, [0.0, 0.0, -10.0]); 
		mat4.rotate(self.mvMatrix, self.degreeY * Math.PI/180, [0,1,0]);
		mat4.rotate(self.mvMatrix, self.degreeX * Math.PI/180, [1,0,0]);
		
		self.gl.uniformMatrix4fv(self.prg.uMVMatrix, false, self.mvMatrix);
		self.gl.uniformMatrix4fv(self.prg.uPMatrix, false, self.pMatrix);

		mat4.set(self.mvMatrix, self.nMatrix);
	    mat4.inverse(self.nMatrix);
		mat4.transpose(self.nMatrix);	

		self.gl.uniformMatrix4fv(self.prg.uNMatrix, false, self.nMatrix);

		self.gl.bindBuffer(self.gl.ARRAY_BUFFER, self.NormalBuffer);
		self.gl.vertexAttribPointer(self.prg.aVertexNormal,3,self.gl.FLOAT, false, 0,0);
		self.gl.enableVertexAttribArray(self.prg.aVertexNormal);

		self.gl.bindBuffer(self.gl.ARRAY_BUFFER, self.normalVerticesBuffer);
		self.gl.vertexAttribPointer(self.prg.aVertexPosition, 3, self.gl.FLOAT, false, 0, 0);
		self.gl.enableVertexAttribArray(self.prg.aVertexPosition);	

		self.gl.drawArrays(self.gl.LINES, 0, self.normalsVertices.length/6);

		self.gl.bindBuffer(self.gl.ARRAY_BUFFER, null);
		self.gl.bindBuffer(self.gl.ELEMENT_ARRAY_BUFFER, null);	
	};

	var renderLoop = function(){
		requestAnimFrame(renderLoop);
		if((self.time + 1000/self.fps) > Date.now()) return;
		draw();
		self.time = Date.now();
	};

	return App;

})();

(function(global) {
	window.addEventListener("DOMContentLoaded", startApp);
	function startApp() {
		var app = new App();
		window.removeEventListener("DOMContentLoaded", startApp);
	}

})(window);

requestAnimFrame = (function() {
    return window.requestAnimationFrame ||
         window.webkitRequestAnimationFrame ||
         window.mozRequestAnimationFrame ||
         window.oRequestAnimationFrame ||
         window.msRequestAnimationFrame ||
         function(/* function FrameRequestCallback */ callback, /* DOMElement Element */ element) {
           window.setTimeout(callback, 1000/60);
         };
})();