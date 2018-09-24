var App = (function() {

	var self;

	function App(){
        self = this;
        init();
    }

	var init = function(){
		
		self.ulElement = document.getElementsByTagName("ul")[0];
		self.ulElement.addEventListener("click", changeUrlIframe);

		self.iframeElement = document.getElementsByTagName("iframe")[0];

	};

	var changeUrlIframe = function(event){

		console.log();

		var action = event.target.getAttribute("data-go");

		if(action != ""){
			var list = 	self.ulElement.children;
			for(var i=0; i< list.length; i++){
				list[i].classList.remove("active");
			}
			event.target.classList.add("active");
		}

		switch(action){
			case "simple": 
				changeIframeSrc("index_triforce.html");
			break;

			case "alpha": 
				changeIframeSrc("goraud_lambertian_colour.html");
			break;

			case "goraud-lambertian": 
				changeIframeSrc("goraud_lambertian.html");
			break;

			case "goraud-phong": 
				changeIframeSrc("goraud_phong.html");
			break;

			case "phong-lambertian": 
				changeIframeSrc("phong_lambertian.html");
			break;

			case "phong-phong": 
				changeIframeSrc("phong_phong.html");
			break;
			default:
		}

	};

	var changeIframeSrc = function(url){

		self.iframeElement.setAttribute("src", url);

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