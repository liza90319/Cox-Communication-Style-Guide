<!doctype html>
<html ng-app>

<head>
    <meta charset="UTF-8">
    <title>Digital Style Guide</title>

    <script type="text/javascript" src="build/tsw/js/jquery.js"></script>
    <script type="text/javascript" src="build/tsw/js/bootstrap.js"></script>
    <script src="https://ajax.googleapis.com/ajax/libs/angularjs/1.4.1/angular.min.js"></script>


    <script type="text/javascript" src="build/tsw/js/lib.uncompressed.js"></script>
    <script type="text/javascript" src="build/tsw/js/cox.uncompressed.js"></script>
    
    <script type="text/javascript" src="build/tsw/js/prism.js"></script>
    
    

    <!--link rel="stylesheet" type="text/css" href="build/tsw/css/prettify.css" /-->



    <link rel="stylesheet" type="text/css" href="build/tsw/css/bootstrap.min.css" />
    <link rel="stylesheet" type="text/css" href="build/tsw/css/all.uncompressed.css" />
    <link rel="stylesheet" type="text/css" href="build/tsw/css/business.uncompressed.css" />
    <link rel="stylesheet" type="text/css" href="build/tsw/css/prism.css" />

    <link rel="stylesheet" type="text/css" href="build/tsw/css/style.css" />
    <link rel="stylesheet" type="text/css" href="build/tsw/css/styles.css" />


</head>
<body data-spy="scroll" data-target=".scrollspy" style="position:relative;">

   <?php include("navbar.inc.php");?>
   
    <div class="container" data-target="#side-menu">
        <div class="row" style="margin-top:5em;">		
				<div id="sidebar" class="col-md-3 scrollspy" style="width: 200px;">
					<?php include("bus_includes/menu.inc.php");?>
                </div><!--sidebar-->
            <!--Main Content Strats-->

           <div class="col-md-9" id="MainContents" role="main" >	
		   	    <?php include("bus_includes/grid_and_column.inc.php")?>
                <?php include("bus_includes/color.inc.php")?> 
                <?php include("bus_includes/typography.inc.php")?>
                <?php include("bus_includes/buttons.inc.php")?>
                <?php include("bus_includes/forms.inc.php")?>
                <?php include("bus_includes/control.inc.php")?>
                <?php include("bus_includes/alert.inc.php")?>
                <?php include("bus_includes/accordion.inc.php")?>
                <?php include("bus_includes/ankle.inc.php")?>
                <?php include("bus_includes/anchor_links_bar.inc.php")?>
                <?php include("bus_includes/breadcrumbs.inc.php") ?>
                <?php include("bus_includes/header.inc.php") ?>
                <?php include("bus_includes/linklist.inc.php") ?>
                <?php include("bus_includes/navigation.inc.php") ?>
                <?php include("bus_includes/offerterms.inc.php") ?>
                <?php include("bus_includes/pagination.inc.php") ?>
                <?php include("bus_includes/tabs.inc.php") ?>
                <?php include("bus_includes/table.inc.php") ?>
                <?php include("bus_includes/textandimage.inc.php") ?>
                <?php include("bus_includes/tooltip.inc.php") ?>
                <?php include("bus_includes/videoplayer.inc.php") ?>
                <?php include("bus_includes/promobox.inc.php") ?>
                <?php include("bus_includes/hero.inc.php") ?>
                  




<div id="res_divider_lines">
    <h2>Divider Lines</h2>
</div>

<div id="res_footer">
    <h2>Footer</h2>
</div>

                    <div id="res_modals">
                        <h2>Modals</h2>
                    </div>


                        <div id="res_social_share">
                            <h2>Social Share</h2>
                        </div>
                    
                   
                    <!-- =========== Right Rail =========== -->
                    <div id="res_right_rail">
                        <h2>Right Rail</h2>
                    </div>
                    <!-- =========== Price Display =========== -->
                    <div id="res_prie_display">
                        <h2>Price Display</h2>
                    </div>
                    <!-- =========== On Demand =========== -->
                    <div id="res_on_demand">
                        <h2>On Demand</h2>
                    </div>
                    <!-- =========== Promo Box =========== -->
                  
                    <!-- =========== Hero =========== -->
                    
                    <!-- =========== Feature Highlight =========== -->
                    <div id="res_feature_highlight">
                        <h2>Feature Highlight</h2>
                    </div>
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


                    <!--Main Contents Ends-->
                </div><!--col-md-9-->

            </div><!--row-->
        </div><!--container-->

    <script>
			$(".sourcecode").css("display","none");
    		$( ".toggle_code" ).click(function() {
				console.log($(this).parent().find(".sourcecode").attr("id"));
				$(this).parent().find(".sourcecode").toggle( "fast", function() {
					
				});
			});
    
    </script>

</body>
</html>