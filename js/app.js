var App = (function() {

	var self;

	function App(){
        self = this;
        init();
    }

	var init = function(){
		createCanvas();
		self.gl = webglUtils.getGLContext(self.canvas);

		self.mvMatrix = mat4.create();
  		self.pMatrix  = mat4.create(); 
  		self.nMatrix  = mat4.create();

  		self.prg = createShaderProgram(self.gl);

  		self.useLighting = false;
  		self.showLines = !self.useLighting;

  		self.degreeX = 0;
		self.degreeY = 0;

  		setupUniformAndAttributes(self.prg, self.gl); 
  		toggleModeType();	

  		self.vertices = setupVertices();
  		self.indices = setupIndices();
  		self.indices_lines = setupIndicesLines(self.indices);

  		self.normals = webglUtils.calculateNormals(self.vertices, self.indices);

		self.VBOBuffer = self.gl.createBuffer();
		self.gl.bindBuffer(self.gl.ARRAY_BUFFER, self.VBOBuffer);
		self.gl.bufferData(self.gl.ARRAY_BUFFER, new Float32Array(self.vertices), self.gl.STATIC_DRAW);

		self.NormalBuffer = self.gl.createBuffer();
		self.gl.bindBuffer(self.gl.ARRAY_BUFFER, self.NormalBuffer);
		self.gl.bufferData(self.gl.ARRAY_BUFFER, new Float32Array(self.normals), self.gl.STATIC_DRAW);

		self.IBOBuffer = self.gl.createBuffer();
		self.gl.bindBuffer(self.gl.ELEMENT_ARRAY_BUFFER, self.IBOBuffer);
		self.gl.bufferData(self.gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(self.indices), self.gl.STATIC_DRAW);

		self.IBOBufferLines = self.gl.createBuffer();
		self.gl.bindBuffer(self.gl.ELEMENT_ARRAY_BUFFER, self.IBOBufferLines);
		self.gl.bufferData(self.gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(self.indices_lines), self.gl.STATIC_DRAW);

		renderLoop();
  
	};

		/*             0 (0,0.867,0)
	              /\
	             /  \
	(-0.5,0,0)1 /____\ 2 (0.5,0,0)
	           /\    /\
	          /  \  /  \
	         /____\/____\
	        3      4     5 (1,-0.867,0)
	(-1,-0.867,0) (0,-0.867,0) 

	*/

	var setupVertices = function(){
		return [
			  0,0.867,0,
			  -0.5,0,0,
			  0.5,0,0,
			  -1,-0.867,0,
			  0,-0.867,0,  
			  1,-0.867,0,
			  
			  0,0.867,0.3,
			  -0.5,0,0.3,
			  0.5,0,0.3,
			  -1,-0.867,0.3,
			  0,-0.867,0.3,  
			  1,-0.867,0.3,
		]
	};


	var setupIndices = function(){
		return [0,1,2, 2,4,5 ,3,4,1, //front
              6,7,8, 7,9,10, 8,10,11, //back
              6,0,2,  6,2,8, 8,2,5 ,8,5,11, //espessura right
              1,0,6,  6,7,1, 1,7,3 ,7,9,3,//espessura left; 
              3,9,10,  3,10,4, 4,10,5 ,10,11,5,//espessura bottom; 
               1,7,4, 4,10,7, 2,10,4 ,8,10,2, 7,1,2, 8,7,2]; //ESPESSURA MIDDLE
	};

	var setupIndicesLines = function(indices){
		var indices_lines = [];
		for(var i=0; i < indices.length; i+=3){
		  indices_lines.push(indices[i]);
		  indices_lines.push(indices[i + 1]);
		  indices_lines.push(indices[i + 1]);
		  indices_lines.push(indices[i + 2]);
		  indices_lines.push(indices[i + 2]);
		  indices_lines.push(indices[i]);
		}
		return indices_lines;
	};

	var setupUniformAndAttributes = function(prg,gl){

	  prg.vertexPosition   = gl.getAttribLocation(prg, "aVertexPosition");
	  prg.aVertexNormal    = gl.getAttribLocation(prg, "aVertexNormal");

	  prg.uPMatrix   	   = gl.getUniformLocation(prg, "uPMatrix");
	  prg.uMVMatrix  	   = gl.getUniformLocation(prg, "uMVMatrix");
	  prg.uNMatrix         = gl.getUniformLocation(prg, "uNMatrix");

	  prg.uLightDirection  = gl.getUniformLocation(prg, "uLightDirection");
	  prg.uLightAmbient    = gl.getUniformLocation(prg, "uLightAmbient");
	  prg.uLightDiffuse    = gl.getUniformLocation(prg, "uLightDiffuse");
	  prg.uMaterialDiffuse = gl.getUniformLocation(prg, "uMaterialDiffuse");

	  prg.useLighting = gl.getUniformLocation(prg, "useLighting");

	  gl.uniform3fv(prg.uLightDirection,  [0.0, 0.2, -10.5]);
	  gl.uniform4fv(prg.uLightAmbient,    [0.01,0.01,0.01,1.0]);
	  gl.uniform4fv(prg.uLightDiffuse,    [1.0,1.0,1.0,1.0]);  
	  gl.uniform4f(prg.uMaterialDiffuse, 0.8,0.8,0.0,1.0);
	  
	};

	var toggleModeType = function(){
		self.useLighting = !self.useLighting;
  		self.showLines = !self.useLighting;
		self.gl.uniform1i(self.prg.useLighting, self.useLighting);
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

		//distance
	    self.degreeY++;
	    self.degreeY = self.degreeY % 360;
	  
	    self.degreeX++;
	    self.degreeX = self.degreeX % 360;
	  
	    if(self.degreeX == 0){
	      toggleModeType();
	    }

	  	self.gl.clearColor(0.2, 0.3, 0.6, 1.0);
	  	self.gl.enable(self.gl.DEPTH_TEST);
		
		self.gl.clear(self.gl.COLOR_BUFFER_BIT | self.gl.DEPTH_BUFFER_BIT);
		self.gl.viewport(0,0,self.canvas.width, self.canvas.height);

		self.gl.uniformMatrix4fv(self.prg.uMVMatrix, false, self.mvMatrix);
		self.gl.uniformMatrix4fv(self.prg.uPMatrix, false, self.pMatrix);
		self.gl.uniformMatrix4fv(self.prg.uNMatrix, false, self.nMatrix);

		self.gl.bindBuffer(self.gl.ARRAY_BUFFER, self.VBOBuffer);
		self.gl.vertexAttribPointer(self.prg.aVertexPosition, 3, self.gl.FLOAT, false, 0, 0);
		self.gl.enableVertexAttribArray(self.prg.vertexPositionAttribute);

		self.gl.bindBuffer(self.gl.ARRAY_BUFFER, self.NormalBuffer);
		self.gl.vertexAttribPointer(self.prg.aVertexNormal,3,self.gl.FLOAT, false, 0,0);
		self.gl.enableVertexAttribArray(self.prg.aVertexNormal);	 
	    

	    mat4.perspective(self.pMatrix, 45, self.canvas.width / self.canvas.height, 0.1, 10000.0);
	    mat4.identity(self.mvMatrix);
	  
	    mat4.translate(self.mvMatrix,self.mvMatrix, [0.0, 0.0, -5.0]); 
	    mat4.rotate(self.mvMatrix,self.mvMatrix, self.degreeY * Math.PI/180, [0,1,0]);
	    mat4.rotate(self.mvMatrix,self.mvMatrix, self.degreeX * Math.PI/180, [1,0,0]);
	    
	 
	    
	    self.gl.uniformMatrix4fv(self.prg.uMVMatrix, false, self.mvMatrix);
	    self.gl.uniformMatrix4fv(self.prg.uPMatrix, false, self.pMatrix);
	  
	    mat4.set(self.mvMatrix, self.nMatrix);
	    mat4.invert(self.nMatrix,self.nMatrix);
	    mat4.transpose(self.nMatrix,self.nMatrix);
	    
	    self.gl.uniformMatrix4fv(self.prg.uNMatrix, false, self.nMatrix);
	    
		if(self.showLines){
		    
		  self.gl.bindBuffer(self.gl.ELEMENT_ARRAY_BUFFER, self.IBOBufferLines);
		  self.gl.drawElements(self.gl.LINES, self.indices_lines.length, self.gl.UNSIGNED_SHORT, 0);
		    
		} else {
		    
		  self.gl.bindBuffer(self.gl.ELEMENT_ARRAY_BUFFER, self.IBOBuffer);
		  self.gl.drawElements(self.gl.TRIANGLES, self.indices.length, self.gl.UNSIGNED_SHORT, 0);
		    
		}
	};

	var renderLoop = function(){
		requestAnimFrame(renderLoop);
    	draw();
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