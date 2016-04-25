$(function() {
	
	//Slidemenu
	$( ".menu-trigger" ).on( "click", function() {
		$( "body" ).toggleClass("menu-active");
	});
	
	// click event for left menu
	$("#library-menu a").on("click", function(e) {
		e.preventDefault();
		
		// remove any active menu class
		$("#library-menu .active").removeClass("active");
		
		// load the content
		var linkUrl = $(this).attr("href"); // get the href value
		if (linkUrl != "" && linkUrl != "#") { // a real url
			getContent(this, linkUrl);
		}
		
		// set this menu as active
		$(this).parent().addClass("active");
	});
	
	//skin toggle
	$( ".css-toggle input" ).on( "click", function() {
		$('#lob-css[rel=stylesheet]').attr('href', this.value);
	});
	
	// check the url for hash values (allows for deep link of ajax)
	if (window.location.hash) {
		// convert our hash into an object (use slice to strip the leading "#")					
		var uri = window.location.hash.slice(1);
		if (uri) {
			getContent("", uri);
		}
	}
	
	// load the content via ajax
	function getContent(obj, contentUrl) {
		$( "body" ).toggleClass("menu-active");
		
		// handle deeplinks
		if (obj == "") {
			// find the link that matches the deep link url
			var activeLink = $("[href='" + contentUrl + "']");

			// set the parent container to active
			$(activeLink).parent().addClass("active");
		}

		window.location = "#" + contentUrl;
		$.ajax({
			url: contentUrl,
			cache: false
		}).done(function( response ) {
			$("#library-details").html(response); // add the ajax content to the page

			$(".library-module").each(function() {
				var sourceCode = $(this).html();
				sourceCode = sourceCode.replace(/\</g,"&lt;");
				sourceCode = sourceCode.replace(/\>/g,"&gt;");
				sourceCode = sourceCode.replace(/^\s*\n/gm,""); //remove empty line breaks
				sourceCode = "<div class='colspan-12 col-reset'><div class='source-header'>Show Source Code</div><pre class='prettyprint'>" + sourceCode + "</pre></div>";
				
				$(this).append(sourceCode);
				
			});
			PR.prettyPrint(); // apply prettyPrint source formatting
			
			// Toggle source code display
			$(".source-header").click(function() {
				if($(this).next().css("display") == "none"){
					$(this).next().css("display","block");
					$(this).html("Hide Source Code");
				} else {
					$(this).next().css("display","none");
					$(this).html("Show Source Code");
				}
			});
		});
	}
	
	
});