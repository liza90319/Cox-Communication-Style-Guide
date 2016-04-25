<div id="res_grid_and_columns">
    <h2>Grid and Columns</h2><br>
    <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</p><br>
    <div id="thebasics" class="panel panel-default">
        <div class="panel-heading"> <h3 class="panel-title">The Basics</h3></div>
        <div class="panel-body">
            <p style="text-align:justify;">The <strong>Design Grid</strong> is an invisible structure used to guide the placement of content (copy and graphics) on a page or screen. The grid helps the designers to determine the relationship of elements on a page.</p><br>
            <p style="text-align:justify;"><strong>Why this grid?</strong><br>Designing within the grid framework helps to ensure page-to-page and device-to-device design consistecy and structural uniformity. This structure helps designers unify a series of dissimilar pages, developers to more accurately reproduce designs, and it brings a greater sense of readability to users. As we move toward a responsive approach, it will be much easier to determine break points and ultimately deliver a seamless experience across device.</p><br>
            <p>The site uses a <strong>12-column, 960 pixel grid. </strong> Each column is a standard width (60 pixels), separated by a 20-pixel gutter or spacing column. The 960 pixel grid is evenly divisible by 26 whole numbers, allowing for maximum flexibility in page design and effective display of many types of content and graphics in a format that is both standardized and easily adaptable.</p><br>
            <p><code>.cols-grid</code>The top-level class, <code>.cols-grid</code> is implemented once in the template. All structure and content for the grid are children of this one node. While there is little styling applied to this class, it is used when defining the styles for <code>.colspan-*</code> to describe how many columns a grid has as a function of the percentage width in the <code>.colspan-*</code> style.</p><br>
            <p>Combining the top-level <code>.cols-*</code> class with the <code>.colspan-*</code> classes allows us to define a layout with a different number of columns. For example, <code>.cols-10 .colspan-5 </code>defines a grid of 10-columns and a module spanning 5 of them. The result would be a module that occupies half the container width exactly like a <code>.cols-grid .colspan-6 </code>styled module. As these <code> .cols-*</code> can safely be nested inside each other, a single page can have different grids and still correctly align with each other.

</p>
        <div class="cols-grid">
            <div class="colspan-12">
                <div class="col-content">
                    <p>12 columns</p>
                </div>
            </div>
            <!-- Wrap New Row -->
            <div class="colspan-11">
                <div class="col-content">
                    <p>11 columns</p>
                </div>
            </div>
            <div class="colspan-1">
                <div class="col-content">
                    <p>1</p>
                </div>
            </div>
            <!-- Wrap New Row -->
            <div class="colspan-10">
                <div class="col-content">
                    <p>10 columns</p>
                </div>
            </div>
            <div class="colspan-2">
                <div class="col-content">
                    <p>2 columns</p>
                </div>
            </div>
            <!-- Wrap New Row -->
            <div class="colspan-9">
                <div class="col-content">
                    <p>9 columns</p>
                </div>
            </div>
            <div class="colspan-3">
                <div class="col-content">
                    <p>3 columns</p>
                </div>
            </div>
            <!-- Wrap New Row -->
            <div class="colspan-8">
                <div class="col-content">
                    <p>8 columns</p>
                </div>
            </div>
            <div class="colspan-4">
                <div class="col-content">
                    <p>4 columns</p>
                </div>
            </div>
            <!-- Wrap New Row -->
            <div class="colspan-7">
                <div class="col-content">
                    <p>7 columns</p>
                </div>
            </div>
            <div class="colspan-5">
                <div class="col-content">
                    <p>5 columns</p>
                </div>
            </div>
            <!-- Wrap New Row -->
            <div class="colspan-6">
                <div class="col-content">
                    <p>6 columns</p>
                </div>
            </div>
            <div class="colspan-6">
                <div class="col-content">
                    <p>6 columns</p>
                </div>
            </div>
        </div><!--cols-grid-->
                            
      </div><!--panel-body-->
          <div class="panel-footer">
              <div class="center-block toggle_code" style="text-align:center;"></div>
              <div class="sourcecode" id="">
                <pre>
                  <code class="language-markup" >
                  <script type="prism-html-markup">
<div class="colspan-12">
	<div class="col-content">
		<p>12 columns</p>
	</div>
</div>
<!-- Wrap New Row -->
<div class="colspan-11">
	<div class="col-content">
		<p>11 columns</p>
	</div>
</div>
<div class="colspan-1">
	<div class="col-content">
		<p>1</p>
	</div>
</div>
<!-- Wrap New Row -->
<div class="colspan-10">
	<div class="col-content">
		<p>10 columns</p>
	</div>
</div>
<div class="colspan-2">
	<div class="col-content">
		<p>2 columns</p>
	</div>
</div>
<!-- Wrap New Row -->
<div class="colspan-9">
	<div class="col-content">
		<p>9 columns</p>
	</div>
</div>
<div class="colspan-3">
	<div class="col-content">
		<p>3 columns</p>
	</div>
</div>
<!-- Wrap New Row -->
<div class="colspan-8">
	<div class="col-content">
		<p>8 columns</p>
	</div>
</div>
<div class="colspan-4">
	<div class="col-content">
		<p>4 columns</p>
	</div>
</div>
<!-- Wrap New Row -->
<div class="colspan-7">
	<div class="col-content">
		<p>7 columns</p>
	</div>
</div>
<div class="colspan-5">
	<div class="col-content">
		<p>5 columns</p>
	</div>
</div>
<!-- Wrap New Row -->
<div class="colspan-6">
	<div class="col-content">
		<p>6 columns</p>
	</div>
</div>
<div class="colspan-6">
	<div class="col-content">
		<p>6 columns</p>
	</div>
</div>	
</script>
                        </code>
                      </pre>
                    </div><!--sourcecode-->	
                </div><!--panel-footer-->
            
            
        </div><!--panel-->
        
<div id="multirowcolumns" class="panel panel-default">
    <div class="panel-heading"> 
    	<h3 class="panel-title">Multi-row Columns</h3>
    </div>
    <div class="panel-body">
		<p>There are layouts that have the far left or right columns vertically spanning more than one row. This is easy to do by properly utilizing the <code>.rowspan-*</code> class.</p><br>
        <p><code>.rowspan-*</code> is applied to the node in the first or last column of a row (as counted by columns spanned), the <code>.rowspan-left .rowspan-right</code> class floats the associated node. This causes other nodes to wrap on the side of this column.</p><br>

<div class="cols-grid">
        <div class="colspan-6">
	<div class="col-content">
		<h3>1st Column</h3>
		<h4><code>.colspan-6</code></h4>
		
	</div>
</div>
<div class="colspan-4">
	<div class="col-content">
		<h3>2nd Column</h3>
		<h4><code>.colspan-4</code></h4>
		
	</div>
</div>
<div class="colspan-2 rowspan-right">
	<div class="col-content">
		<h3>3rd Column</h3>
		<h4><code>.colspan-2 .rowspan-right</code></h4>
	</div>
</div>
<div class="colspan-4">
	<div class="col-content">
		<h3>4th Column</h3>
		<h4><code>.colspan-4</code></h4>
		
	</div>
</div>
<div class="colspan-6">
	<div class="col-content">
		<h3>5th Column</h3>
		<h4><code>.colspan-6</code></h4>
	</div>
</div>
        </div><!--colsgrid-->
 	</div>
    <div class="panel-footer">
      <div class="center-block toggle_code" style="text-align:center;"></div>
      <div class="sourcecode" id="">
       <pre>
      	<code class="language-markup" >
		  <script type="prism-html-markup">
<div class="colspan-6">
	<div class="col-content">
		<h3>1st Column</h3>
		<h4> ... </h4>
		<p> ... </p>
	</div>
</div>
<div class="colspan-4">
	<div class="col-content">
		<h4> ... </h4>
		<p> ... </p>
	</div>
</div>
<div class="colspan-2 rowspan-right">
	<div class="col-content">
		<h4> ... </h4>
		<p> ... </p>
	</div>
</div>
<div class="colspan-4">
	<div class="col-content">
		<h4> ... </h4>
		<p> ... </p>
	</div>
</div>
<div class="colspan-6">
	<div class="col-content">
		<h4> ... </h4>
		<p> ... </p>
	</div>
</div>

          </script>
        </code>
       </pre>
      </div><!--sourcecode-->
    </div><!--panel-footer-->
 </div><!--Panel-->
 
     <div id="internalcolumns" class="panel panel-default" id="internal_columns">
        <div class="panel-heading"> 
            <h3 class="panel-title">Internal Columns</h3>
        </div>
        <div class="panel-body">	
        	<div class="cols-grid">
                <div class="colspan-6">
                    <div class="col-content">
                        <h3>1st Widget</h3>
                        <h4><code>.colspan-6</code></h4>
                        <div class="cols-3">
                            <div class="colspan-1">
                                <div class="col-content">
                                    <h4><code>.cols-3 .colspan-1</code></h4>
                                </div>
                            </div>
                            <div class="colspan-1">
                                <div class="col-content">
                                    <h4><code>.cols-3 .colspan-1</code></h4>
                                </div>
                            </div>
                            <div class="colspan-1">
                                <div class="col-content">
                                    <h4><code>.cols-3 .colspan-1</code></h4>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="colspan-6">
                    <div class="col-content">
                        <h3>2nd Widget</h3>
                        <h4><code>.colspan-6</code></h4>
                        <div class="cols-3">
                            <div class="colspan-1">
                                <div class="col-content">
                                    <h4><code>.cols-3 .colspan-1</code></h4>
                                </div>
                            </div>
                            <div class="colspan-2">
                                <div class="col-content">
                                    <h4><code>.cols-3 .colspan-2</code></h4>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <!-- Wrap New Row -->
                <div class="colspan-8">
                    <div class="col-content">
                        <h3>3rd Widget</h3>
                        <h4><code>.colspan-8</code></h4>
                        <div class="cols-4">
                            <div class="colspan-1">
                                <div class="col-content">
                                    <h4><code>.cols-4 .colspan-1</code></h4>
                                </div>
                            </div>
                            <div class="colspan-2">
                                <div class="col-content">
                                    <h4><code>.cols-4 .colspan-2</code></h4>
                                </div>
                            </div>
                            <div class="colspan-1">
                                <div class="col-content">
                                    <h4><code>.cols-4 .colspan-1</code></h4>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="colspan-4">
                    <div class="col-content">
                        <h3>4th Widget</h3>
                        <h4><code>.colspan-4</code></h4>
                        <div class="cols-2">
                            <div class="colspan-1">
                                <div class="col-content">
                                    <h4><code>.cols-2 .colspan-1</code></h4>
                                </div>
                            </div>
                            <div class="colspan-1">
                                <div class="col-content">
                                    <h4><code>.cols-2 .colspan-1</code></h4>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div><!--cols-grid-->
        </div><!--panel-body-->
        <div class="panel-footer">
          <div class="center-block toggle_code" style="text-align:center;"></div>
          <div class="sourcecode" id="">
           <pre>
            <code class="language-markup" >
		<script type="prism-html-markup">
<div class="colspan-6">
  <div class="col-content">
	  <h3>1st Widget</h3>
	  <h4><code>.colspan-6</code></h4>
	  <div class="cols-3">
		  <div class="colspan-1">
			  <div class="col-content">
				  <h4><code>.cols-3 .colspan-1</code></h4>
			  </div>
		  </div>
		  <div class="colspan-1">
			  <div class="col-content">
				  <h4><code>.cols-3 .colspan-1</code></h4>
			  </div>
		  </div>
		  <div class="colspan-1">
			  <div class="col-content">
				  <h4><code>.cols-3 .colspan-1</code></h4>
			  </div>
		  </div>
	  </div>
  </div>
</div>
<div class="colspan-6">
  <div class="col-content">
	  <h3>2nd Widget</h3>
	  <h4><code>.colspan-6</code></h4>
	  <div class="cols-3">
		  <div class="colspan-1">
			  <div class="col-content">
				  <h4><code>.cols-3 .colspan-1</code></h4>
			  </div>
		  </div>
		  <div class="colspan-2">
			  <div class="col-content">
				  <h4><code>.cols-3 .colspan-2</code></h4>
			  </div>
		  </div>
	  </div>
  </div>
</div>
<!-- Wrap New Row -->
<div class="colspan-8">
  <div class="col-content">
	  <h3>3rd Widget</h3>
	  <h4><code>.colspan-8</code></h4>
	  <div class="cols-4">
		  <div class="colspan-1">
			  <div class="col-content">
				  <h4><code>.cols-4 .colspan-1</code></h4>
			  </div>
		  </div>
		  <div class="colspan-2">
			  <div class="col-content">
				  <h4><code>.cols-4 .colspan-2</code></h4>
			  </div>
		  </div>
		  <div class="colspan-1">
			  <div class="col-content">
				  <h4><code>.cols-4 .colspan-1</code></h4>
			  </div>
		  </div>
	  </div>
  </div>
</div>

<div class="colspan-4">
  <div class="col-content">
	  <h3>4th Widget</h3>
	  <h4><code>.colspan-4</code></h4>
	  <div class="cols-2">
		  <div class="colspan-1">
			  <div class="col-content">
				  <h4><code>.cols-2 .colspan-1</code></h4>
			  </div>
		  </div>
		  <div class="colspan-1">
			  <div class="col-content">
				  <h4><code>.cols-2 .colspan-1</code></h4>
			  </div>
		  </div>
	  </div>
  </div>
</div>

              </script>
            </code>
           </pre>
          </div><!--sourcecode-->
        </div><!--panel-footer-->
    </div><!--panel-->
    
        
 </div><!--res_grid_and_columns-->
 <br>