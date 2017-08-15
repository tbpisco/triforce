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
  		self.pMatrix = mat4.create(); // The projection matrix
  		self.nMatrix =  mat4.create();// The normal matrix

  		self.prg = createShaderProgram(self.gl);

  		self.useLighting = true;
  		self.showLines = false;
  
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

	return App;

})();

(function(global) {
	
	//application start point
	window.addEventListener("DOMContentLoaded", startApp);
	function startApp() {

		var app = new App();
		window.removeEventListener("DOMContentLoaded", startApp);
		//setTimeout is used so that on mobile, the page width can be finalised
		//before content is added, fixing a zoom issue that sometimes occurs
		//setTimeout(function() { window.app = new GAME.gameApp(); }, 50);
	}

})(window);