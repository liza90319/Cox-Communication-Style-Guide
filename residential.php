<!doctype html>
<html>

<head>
    <meta charset="UTF-8">
    <title>Digital Style Guide</title>


    <!--link rel="stylesheet" type="text/css" href="build/tsw/css/prettify.css" /-->

    <link rel="stylesheet" type="text/css" href="build/tsw/css/bootstrap.min.css" />
    <link href="http://netdna.bootstrapcdn.com/font-awesome/3.2.1/css/font-awesome.min.css" rel="stylesheet">
    <link rel="stylesheet" type="text/css" href="build/tsw/css/all.uncompressed.css" />
    <link rel="stylesheet" type="text/css" href="build/tsw/css/residential.uncompressed.css" />
   
    <link rel="stylesheet" type="text/css" href="build/tsw/css/prism.css" />

    <link rel="stylesheet" type="text/css" href="build/tsw/css/style.css" />
	<link rel="stylesheet" type="text/css" href="build/tsw/css/styles.css" />
	
    <!--script type="text/javascript" src="build/tsw/js/bootstrap.js"></script-->
    <!--script src="http://cdnjs.cloudflare.com/ajax/libs/twitter-bootstrap/2.1.0/bootstrap.min.js"></script>
    <script src="http://netdna.bootstrapcdn.com/twitter-bootstrap/2.3.1/js/bootstrap.min.js"></script-->
    
    
    
    <script src="https://ajax.googleapis.com/ajax/libs/angularjs/1.4.1/angular.min.js"></script>
    <script type="text/javascript" src="build/tsw/js/prism.js"></script>
    <script type="text/javascript" src="build/tsw/js/jquery-1.8.3.min.js"></script>
    <script type="text/javascript" src="build/tsw/js/animatescroll.js"></script>
    
    <script type="text/javascript" src="build/tsw/js/bootstrap.js"></script>
    <script type="text/javascript" src="build/tsw/js/lib.uncompressed.js"></script>
    <script type="text/javascript" src="build/tsw/js/cox.uncompressed.js"></script>
    <script type="text/javascript" src="build/tsw/js/scripts.js"></script>
    
</head>

<body data-spy="scroll" data-target=".scrollspy" style="position:relative;">
    
   <?php include("navbar.inc.php");?>


    <div class="container" style="position:relative;top:6em;">
        <div class="row">
        	<div id="sidebar" class="col-md-3 scrollspy" style="width: 200px;">
				<?php include("res_includes/menu.inc.php");?>
            </div> <!--side-menu-->
            <!--Main Content Strats-->

            <div class="col-md-9" id="MainContents" role="main" >
 
				<section id="style">
				<?php include("res_includes/grid_and_column.inc.php")?>
                <?php include("res_includes/color.inc.php")?> 
                <?php include("res_includes/typography.inc.php")?>
                <?php include("res_includes/buttons.inc.php")?>
                <?php include("res_includes/forms.inc.php")?>
                <?php include("res_includes/alert.inc.php")?>
                </section>
                <hr>
                <section id="component">
                <?php include("res_includes/accordion.inc.php")?>
                <?php include("res_includes/ankle.inc.php")?>
                <?php include("res_includes/anchor_links_bar.inc.php")?>
                <?php include("res_includes/breadcrumbs.inc.php") ?>
                <?php include("res_includes/divider.inc.php") ?>
                <?php include("res_includes/footer.inc.php") ?>
                <?php include("res_includes/header.inc.php") ?>
                <?php include("res_includes/linklist.inc.php") ?>
                <?php include("res_includes/modal.inc.php") ?>
                <?php include("res_includes/navigation.inc.php") ?>
                <?php include("res_includes/offerterms.inc.php") ?>
                <?php include("res_includes/pagination.inc.php") ?>
                <?php include("res_includes/tabs.inc.php") ?>
                <?php include("res_includes/table.inc.php") ?>
                <?php include("res_includes/comparison_chart.inc.php") ?>
                <?php include("res_includes/textandimage.inc.php") ?>
                <?php include("res_includes/tooltip.inc.php") ?>
                <?php include("res_includes/video_player.inc.php") ?>
                <?php include("res_includes/on_demand.php") ?>
                <?php include("res_includes/promobox.inc.php") ?>
                <?php include("res_includes/hero.inc.php") ?>
                <?php include("res_includes/feature_highlights.inc.php") ?>
                
                </section>
                <section id="template">
                 
                   

                        <div id="res_social_share">
                            <h2>Social Share</h2>
                        </div>
                    
                   
                    <!-- =========== Right Rail =========== -->
                    <div id="res_right_rail">
                        <h2>Right Rail</h2>
                        http://localhost:8888/ui/4_1/tsw/html/rail-feature.html
                    </div>
                    <!-- =========== Price Display =========== -->
                    <div id="res_prie_display">
                        <h2>Price Display</h2>
                        http://localhost:8888/ui/4_1/tsw/html/price.html
                    </div>
                    <!-- =========== On Demand =========== -->
                    <div id="res_on_demand">
                        <h2>On Demand</h2>
                        http://localhost:8888/ui/4_1/tsw/html/on-demand.html
                    </div>
                    <!-- =========== Promo Box =========== -->
 

                    <div id="res_channel_lineup">
                        <h2>Channel Lineup</h2>
                    </div>
                    <div id="res_comparison_chart">
                        <h2>Comparision Chart</h2>
                    </div>
                    <div id="res_best_offer">
                        <h2>Best Offer</h2>
                    </div>

                    <div id="res_search_and_promote">
                        <h2>Search and Promote</h2>
                    </div>

				</section>  
                    <!--Main Contents Ends-->
                </div><!--main content-->
            </div><!--row-->
            
            <footer>I am the footer</footer>
        </div><!--container-->
	<?php include("res_includes/scroll_arrows.inc.php") ?>
    
	
	<script>
	

			/*$('#sidebar').on('activate.bs.scrollspy', function () {
			  item = $('#nav').find(".active").last();
			  console.log(item);
			  item.animatescroll({element: '#nav', top:60});
			});*/
			
			/*$(window).on("scroll", function() {
				item = $('#nav').find("li.active li.active").last();
				console.log(item);
				item.css("background-color", "red");
				
			  	//item.animatescroll({element: '#nav', padding:-20, scrollSpeed:1000});
				$('#nav').animate({scrollTop: item.position().top + item.parent().position().top },'slow');
			});*/
			
			
			
			$(".sourcecode").css("display","none");
    		$( ".toggle_code" ).click(function() {
				console.log($(this).parent().find(".sourcecode").attr("id"));
				$(this).parent().find(".sourcecode").toggle( "fast", function() {
					
				});
			}); 
			
			
			/* $(function() {

    var $sidebar   = $("#nav"), 
        $window    = $(window),
		
        offset     = $sidebar.offset(),
        topPadding = 10;

    $(window).scroll(function() {
		var $movedistance = $sidebar.find(".active").last();
		var $movedistancetest = $sidebar.find(".active").first();
		var $movedistancelength = $sidebar.find(".active").length;
		//$movedistance.css("background-color","yellow");
		//$activeclass.removeClass("active");
		//console.log($sidebar.find(".active").length);
		//console.log($movedistance.text().trim());
		if ($movedistancelength == 2) {
			$('#nav').animate({scrollTop: $movedistancetest.position().top + $movedistance.position().top });
			}
		else{
			$('#nav').animate({scrollTop:  $movedistancetest.position().top +  $movedistance.parent().position().top + $movedistance.position().top });
			}
		console.log($movedistance.parent().position().top + $movedistance.position().top);
		
		
		
		
        /*if ( $movedistance.scrollTop() > window.innerHeight/2) {
			
			console.log($movedistance.attr("class"), $movedistance.scrollTop(), window.innerHeight/2);
			
			
            $sidebar.stop().animate({
                marginTop: $movedistance
            });
        } else {
            $sidebar.stop().animate({
                marginTop: 0
            });
        }*/
		
		
		
		
  /*  });
    
}); */
			
			
    </script>
  
	
</body>

</html>