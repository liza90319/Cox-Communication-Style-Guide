<div id="res_forms">
  <h2>Forms</h2><br>
  <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</p><br>
  <h3 class="comments">Radio Button Group need to bypass Bootstrap border-box</h3>
  	<p class="comments">
    * {
    /* -webkit-box-sizing: border-box; */
    -moz-box-sizing: border-box;
    /* box-sizing: border-box; */</p>

  <div class="panel panel-default" id="standardforms">
      <div class="panel-heading">
          <h3 class="panel-title">Standard Forms</h3>
      </div>

      <div class="panel-body">
         <div class="cols-grid">   
            <div class="colspan-10">
              <div class="cols-6">
             <form class="form col-content" action="#forms.html" method="post">
              <fieldset>
                  <label class="colspan-2" for="fname-input1">First Name</label>
                  <div class="colspan-4">
                      <input type="text" name="fname" id="fname-input1" size="30" class="required" placeholder="Please enter your first name">
                      <a href="#" data-content-element="fname-help" class="tooltip-trigger btn-help">Help for First name</a>
                      <div id="fname-help" class="tooltip-message">
                          <p>Contextual help to provide more details about this field.</p>
                      </div>
                  </div>
                  
                   <label class="colspan-2" for="lname-input2">Last Name</label>
                   <div class="colspan-4">
                              <input name="lname" id="lname-input2" size="30" class="required" placeholder="Please enter your last name" type="text">
                   </div>
                   
                   <label class="colspan-2" for="street-input1">Address</label>
                  <div class="colspan-4">
                      <input type="text" name="street" id="street-input1" size="30" placeholder="Please enter your address" class="required">
                  </div>
                   <label class="colspan-2" for="city-input2">City</label>
                  <div class="colspan-4">
                      <input type="text" name="city" id="city-input2" size="30" minlength="3" class="required" placeholder="Please enter your city">
                  </div>
                  <label class="colspan-2" for="phone-input1">Phone Number</label>
                  <div class="colspan-4">
                      <input type="tel" name="phone" id="phone-input1" maxlength="10" size="30" class="required" data-mask="(000) 000-0000" placeholder="Please enter phone number">
                  </div>
                  <label class="colspan-2" for="email-input">Email</label>
                  <div class="colspan-4">
                      <input type="text" name="email" id="email-input" size="30" class="required email" placeholder="Please enter your email">
                  </div>
                  <label class="colspan-2" for="number-input">Number</label>
                  <div class="colspan-4">
                      <input type="tel" name="txtNumber" id="number-input" size="30" range="10,20" class="range required number" placeholder="Please enter a number">
                  </div>
                  <label class="colspan-2" for="alphanumeric-input">Alpha-numeric</label>
                  <div class="colspan-4">
                      <input type="text" name="txtAlphanumeric" id="alphanumeric-input" size="30" class="required alphanumeric" placeholder="Please enter an alphanumeric">
                  </div>
                  <label class="colspan-2" for="alpha-input">Alpha</label>
                  <div class="colspan-4">
                      <input type="text" name="txtAlpha" id="alpha-input" size="30" class="required lettersonly" placeholder="Please enter alphabetic characters">
                  </div>
                  <label class="colspan-2" for="currency-input">Currency</label>
                  <div class="colspan-4">
                      <input type="text" name="txtCurrency" class="required currency" id="currency-input" size="30" data-mask="C" placeholder="Please enter currency value">
                  </div>
                  <label class="colspan-2" for="zipcode">Zipcode</label>
                  <div class="colspan-4">
                      <input type="tel" name="zipcode" id="zipcode" minlength="5" maxlength="10" size="30" class="required" data-mask="00000-0000" placeholder="Please enter a zipcode">
                  </div>
                  <label class="colspan-2" for="password">Password</label>
                  <div class="colspan-4">
                      <input name="password" id="password" size="30" class="required" type="password" minlength="5">
                  </div>
                  <label class="colspan-2" for="confirm-password">Confirm Password</label>
                  <div class="colspan-4">
                      <input name="confirm-password" id="confirm-password" size="30" class="required" equalto="#password" minlength="5" type="password">
                  </div>
                   
              </fieldset>
             </form>
             </div><!--cols-6-->
            </div><!--colspan-6-->
          </div><!--cols-grid-->
      </div><!--.panel-body-->
          <div class="panel-footer">
          <div class="center-block toggle_code" style="text-align:center;"></div>
          <div class="sourcecode" id="test">
              <code class="language-markup" >
                 <script type="prism-html-markup">			
<form class="form col-content" action="#forms.html" method="post">
  <fieldset>
	  <label class="colspan-2 required-asterisk" for="fname-input1">First Name</label>
	  <div class="colspan-4">
		  <input type="text" name="fname" id="fname-input1" size="30" class="required" placeholder="Please enter your first name">
		  <a href="#" data-content-element="fname-help" class="tooltip-trigger btn-help">Help for First name</a>
		  <div id="fname-help" class="tooltip-message">
			<p>Contextual help to provide more details about this field.</p>
		  </div>
	  </div>
	  
	  <label class="colspan-2 required-asterisk" for="lname-input2">Last Name</label>
	  <div class="colspan-4">
	  	<input name="lname" id="lname-input2" size="30" class="required" placeholder="Please enter your last name" type="text">
	  </div>
	  
	  <label class="colspan-2 required-asterisk" for="street-input1">Address</label>
	  <div class="colspan-4">
	  	<input type="text" name="street" id="street-input1" size="30" placeholder="Please enter your address" class="required">
	  </div>
	  
	  <label class="colspan-2 required-asterisk" for="city-input2">City</label>
	  <div class="colspan-4">
	  	<input type="text" name="city" id="city-input2" size="30" minlength="3" class="required" placeholder="Please enter your city">
	  </div>
	  
	  <label class="colspan-2 required-asterisk" for="phone-input1">Phone Number</label>
	  <div class="colspan-4">
	  	<input type="tel" name="phone" id="phone-input1" maxlength="10" size="30" class="required" data-mask="(000) 000-0000" placeholder="Please enter phone number">
	  </div>
	  
	  <label class="colspan-2 required-asterisk" for="email-input">Email</label>
	  <div class="colspan-4">
	  	<input type="text" name="email" id="email-input" size="30" class="required email" placeholder="Please enter your email">
	  </div>
	  
	  <label class="colspan-2 required-asterisk" for="number-input">Number</label>
	  <div class="colspan-4">
	  	<input type="tel" name="txtNumber" id="number-input" size="30" range="10,20" class="range required number" placeholder="Please enter a number">
	  </div>
	  
	  <label class="colspan-2 required-asterisk" for="alphanumeric-input">Alpha-numeric</label>
	  <div class="colspan-4">
	  	<input type="text" name="txtAlphanumeric" id="alphanumeric-input" size="30" class="required alphanumeric" placeholder="Please enter an alphanumeric">
	  </div>
	  
	  <label class="colspan-2 required-asterisk" for="alpha-input">Alpha</label>
	  <div class="colspan-4">
	  	<input type="text" name="txtAlpha" id="alpha-input" size="30" class="required lettersonly" placeholder="Please enter alphabetic characters">
	  </div>
	  
	  <label class="colspan-2 required-asterisk" for="currency-input">Currency</label>
	  <div class="colspan-4">
	  	<input type="text" name="txtCurrency" class="required currency" id="currency-input" size="30" data-mask="C" placeholder="Please enter currency value">
	  </div>
	  
	  <label class="colspan-2 required-asterisk" for="zipcode">Zipcode</label>
	  <div class="colspan-4">
	  	<input type="tel" name="zipcode" id="zipcode" minlength="5" maxlength="10" size="30" class="required" data-mask="00000-0000" placeholder="Please enter a zipcode">
	  </div>
	  
	  <label class="colspan-2 required-asterisk" for="password">Password</label>
	  <div class="colspan-4">
	  	<input name="password" id="password" size="30" class="required" type="password" minlength="5">
	  </div>
	  
	  <label class="colspan-2" for="confirm-password">Confirm Password</label>
	  <div class="colspan-4">
	  	<input name="confirm-password" id="confirm-password" size="30" class="required" equalto="#password" minlength="5" type="password">
	  </div>
  </fieldset>
</form>
                                </script>
                                            </code>
                                        
                              </div><!--source code-->
                            </div><!--panel_footer-->
                        </div><!--form panel-->
			
            <!-- INPUTS AND SELECTION -->
            
    <div class="panel panel-default" id="inputsandselection">
        <div class="panel-heading">
            <h3 class="panel-title">Inputs and Selections</h3>
        </div>

        <div class="panel-body">
         <div class="cols-grid">
            <div class="colspan-6">
                <div class="cols-6">
                   <form class="form col-content" action="#forms.html" method="post">
                    <fieldset>
                        <label class="colspan-2" for="calendar-input-start">Start Date</label>
                        <div class="colspan-4">
                            <input name="calendar-input-start" id="calendar-input-start" size="11" class="required date date-picker" maxlength="10" placeholder="mm/dd/yyyy" readonly type="text">
                            </div>
                            <label class="colspan-2" for="calendar-input-end">End Date</label>
                            <div class="colspan-4">
                                <input name="calendar-input-end" id="calendar-input-end" size="11" class="required date date-picker" maxlength="10" placeholder="mm/dd/yyyy" readonly type="text">
                                </div>
                                <label class="colspan-2" for="time">Time</label>
                                <div class="colspan-4">
                                    <input name="time" maxlength="4" size="5" placeholder="hh:mm" data-mask="00:00" type="tel">
                                </div>
                                
                                <label class="colspan-2">SpinBox</label>
                                    <div class="sb-wrapper colspan-4 spinner">
                                        <input type="button" value="—" name="sb-down" class="sb-button disabled" data-spin-type="decrease" id="sb-down" title="decrease">
                                        <div class="sb-circle-wrapper">
                                            <div class="sb-circle">									
                                                <span step="1" max="4" min="0" class="sb-input"> 0 </span>
                                            </div>
                                        </div>
                                        <input type="button" value="+" name="sb-up" class="sb-button" data-spin-type="increase" id="sb-up" title="increase">
                                    </div>
                                   
                                    <label class="colspan-2" for="state-input">State</label>
                                    <div class="colspan-4">
                                        <select name="state" id="state-input" class="required">
                                            <option value="">Select One</option>
                                            <option value="AZ">Arizona</option>
                                            <option value="AR">Arkansas</option>
                                            <option value="CA">California</option>
                                            <option value="CT">Connecticut</option>
                                            <option value="FL">Florida</option>
                                            <option value="GA">Georgia</option>
                                            <option value="ID">Idaho</option>
                                            <option value="IA">Iowa</option>
                                            <option value="KS">Kansas</option>
                                            <option value="LA">Louisiana</option>
                                            <option value="MA">Massachusetts</option>
                                            <option value="MO">Missouri</option>
                                            <option value="NE">Nebraska</option>
                                            <option value="NV">Nevada</option>
                                            <option value="NC">North Carolina</option>
                                            <option value="OH">Ohio</option>
                                            <option value="OK">Oklahoma</option>
                                            <option value="RI">Rhode Island</option>
                                            <option value="VA">Virginia</option>
                                        </select>
                                    </div><!--colspan-4-->    
                        </fieldset>
                    </form>
                </div><!--cols-6-->
            </div><!--colspan-6-->
        </div><!--cols-grid-->
        </div><!--panel-body-->
     <div class="panel-footer">
            <div class="center-block toggle_code" style="text-align:center;"></div>
            <div class="sourcecode" id="test">
            <pre>
       <code class="language-markup" >
       <script type="prism-html-markup">			                	 
<div class="cols-grid">
  <div class="colspan-6">
	  <div class="cols-6">
		  <form class="form col-content" action="#forms.html" method="post">
			  <fieldset>
				<label class="colspan-2" for="calendar-input-start">Start Date</label>
				<div class="colspan-4">
					  <input name="calendar-input-start" id="calendar-input-start" size="11" class="required date date-picker" maxlength="10" placeholder="mm/dd/yyyy" readonly type="text">
				  </div>
					  <label class="colspan-2" for="calendar-input-end">End Date</label>
				<div class="colspan-4">
					<input name="calendar-input-end" id="calendar-input-end" size="11" class="required date date-picker" maxlength="10" placeholder="mm/dd/yyyy" readonly type="text">
			    </div>
						  <label class="colspan-2" for="time">Time</label>
				<div class="colspan-4">
						  <input name="time" maxlength="4" size="5" placeholder="hh:mm" data-mask="00:00" type="tel">
				</div>
				
				<label class="colspan-2">SpinBox</label>
				<div class="sb-wrapper colspan-4 spinner">
					<input type="button" value="—" name="sb-down" class="sb-button disabled" data-spin-type="decrease" id="sb-down" title="decrease">
					<div class="sb-circle-wrapper">
						<div class="sb-circle">									
							<span step="1" max="4" min="0" class="sb-input"> 0 </span>
						</div>
					</div>
					<input type="button" value="+" name="sb-up" class="sb-button" data-spin-type="increase" id="sb-up" title="increase">
				</div>
				
						  <label class="colspan-2" for="state-input">State</label>
				<div class="colspan-4">
					<select name="state" id="state-input" class="required">
						<option value="">Select One</option>
						<option value="AZ">Arizona</option>
						<option value="AR">Arkansas</option>
						<option value="CA">California</option>
						<option value="CT">Connecticut</option>
						<option value="FL">Florida</option>
						<option value="GA">Georgia</option>
						<option value="ID">Idaho</option>
						<option value="IA">Iowa</option>
						<option value="KS">Kansas</option>
						<option value="LA">Louisiana</option>
						<option value="MA">Massachusetts</option>
						<option value="MO">Missouri</option>
						<option value="NE">Nebraska</option>
						<option value="NV">Nevada</option>
						<option value="NC">North Carolina</option>
						<option value="OH">Ohio</option>
						<option value="OK">Oklahoma</option>
						<option value="RI">Rhode Island</option>
						<option value="VA">Virginia</option>
					</select>
			    </div><!--colspan-4-->
			  </fieldset>
			</form>
		</div> <!--cols-6-->
	</div> <!--colspan-6-->
</div><!--cols-grid-->
                        </script>
                                 </code>
                                 </pre>
                               </div><!--source code-->
                            </div><!--panel_footer-->
                        </div><!--panel-->


                        <!-- =========== Comments =========== -->
                        
<div class="panel panel-default" id="comments">
    <div class="panel-heading">
        <h3 class="panel-title">Comments</h3>
    </div>
    <div class="panel-body">
        <div class="cols-grid">
            <div class="colspan-12">
                <div class="cols-12">
                    <form class="form col-content" action="#forms.html" method="post">
                        <label class="colspan-10" for="comments">Comments</label>
                        <div class="colspan-10">
                            <textarea name="comments" id="comments">This is a comment area.</textarea>
                        </div>
                    </form>
                </div>
                <!--cols-12-->
            </div>
            <!--colspan-12-->
        </div>
        <!--cols-grid-->
    </div>
    <!--.panel-body-->
    <div class="panel-footer">
        <div class="center-block toggle_code" style="text-align:center;"></div>
        <div class="sourcecode" id="test">
                <pre>
                <code class="language-markup" >
                    <script type="prism-html-markup">
<label class="colspan-10" for="comments">Comments</label>
<div class="colspan-10">
<textarea name="comments" id="comments">This is a comment area.</textarea>
</div>
                    </script>
                </code>
                </pre>
        </div>
        <!--sourcecode-->
    </div>
    <!--panel-footer-->
</div>
<!--.panel-->
			      <!-- =========== Checkboxes =========== -->
  <div class="panel panel-default">
      <div class="panel-heading">
          <h3 class="panel-title">Checkboxes</h3>
      </div>

      <div class="panel-body">
      <div class="cols-grid">
          <div class="colspan-6">
              <div class="cols-6">
                  <form class="form col-content" action="#forms.html" method="post">
                      <fieldset>
                          <label class="colspan-2">Services</label>
                              <span class="colspan-4">						
                                  <input class="required" name="services" id="service-tv" type="checkbox">
                                  <label for="service-tv">TV</label>
                                  <input class="required" name="services" id="service-internet" type="checkbox">
                                  <label for="service-internet">Internet</label>															
                              </span>
                          
                        
                          <br></br>
                          <!--vertically grouped check-boxes-->
                          <div class="colspan-6">  
                          <label>What security features are you interested about?</label>						
                      </div>				
                      <span class="colspan-6 vertical-group-element">
                          <input class="required" name="check-services" id="service-security" value="Home Security" type="checkbox">
                          <label for="service-security">Home Security</label> 
                      </span>
                      <span class="colspan-6 vertical-group-element">
                          <input class="required" name="check-services" id="service-automation" value="Home Automation" type="checkbox">
                          <label for="service-automation">Home Automation</label> 
                      </span>
                      <span class="colspan-6 vertical-group-element">
                          <input class="required" name="check-services" id="service-safety" value="Home Safety" type="checkbox">
                          <label for="service-safety">Home Safety</label> 
                      </span>
                      <span class="colspan-6 vertical-group-element">
                          <input class="required" name="check-services" id="service-surveillance" value="Home Surveillance" type="checkbox">
                          <label for="service-surveillance">Home Surveillance</label>
                      </span>                 
                      </fieldset>
                  </form>
              </div><!--cols-6-->
          </div><!--colspan-6-->
        </div><!--cols-grid-->
      </div><!--panel-body-->
      
      <div class="panel-footer">
          <div class="center-block toggle_code" style="text-align:center;"></div>
          <div class="sourcecode" id="test">
              <code class="language-markup" >
                  <script type="prism-html-markup">
<div class="cols-grid">
  <div class="colspan-6">
	  <div class="cols-6">
		  <form class="form col-content" action="#forms.html" method="post">
			  <fieldset>
				  <label class="colspan-2">Services</label>
					  <span class="colspan-4">						
						  <input class="required" name="services" id="service-tv" type="checkbox">
						  <label for="service-tv">TV</label>
						  <input class="required" name="services" id="service-internet" type="checkbox">
						  <label for="service-internet">Internet</label>															
					  </span>
				  <!--vertically grouped check-boxes-->
				  <div class="colspan-6">  
				  <label>What security features are you interested about?</label>						
			  </div>				
			  <span class="colspan-6 vertical-group-element">
				  <input class="required" name="check-services" id="service-security" value="Home Security" type="checkbox">
				  <label for="service-security">Home Security</label> 
			  </span>
			  <span class="colspan-6 vertical-group-element">
				  <input class="required" name="check-services" id="service-automation" value="Home Automation" type="checkbox">
				  <label for="service-automation">Home Automation</label> 
			  </span>
			  <span class="colspan-6 vertical-group-element">
				  <input class="required" name="check-services" id="service-safety" value="Home Safety" type="checkbox">
				  <label for="service-safety">Home Safety</label> 
			  </span>
			  <span class="colspan-6 vertical-group-element">
				  <input class="required" name="check-services" id="service-surveillance" value="Home Surveillance" type="checkbox">
				  <label for="service-surveillance">Home Surveillance</label>
			  </span>                 
			  </fieldset>
		  </form>
	  </div><!--cols-6-->
  </div><!--colspan-6-->
</div><!--cols-grid-->
										</script>
                                    </code>
                                </div><!--sourcecode-->
                            </div><!--panel-footer-->
                          </div><!--panel-->
                                      
    
                        <!-- =========== Radio Buttons =========== -->
  <div class="panel panel-default" id="radiobuttons">
      <div class="panel-heading">
          <h3 class="panel-title">Radio Buttons</h3>
      </div>

      <div class="panel-body">
       <div class="cols-grid">
          <div class="colspan-6">
              <div class="cols-6">
                  <form class="form col-content" action="#forms.html" method="post">
                      <fieldset>
                         <label class="colspan-6">Do you like our service?</label>				
                          <span class="colspan-6">
                              <input name="service" id="service-yes" checked="checked" value="yes" type="radio">
                              <label for="service-yes">Yes</label> 
                          </span>
                          <span class="colspan-6">
                              <input name="service" id="service-no" value="no" type="radio">
                              <label for="service-no">No</label>
                          </span>
                          <span class="colspan-6">
                              <input name="service" id="service-hmmm" value="hmm" type="radio">
                              <label for="service-hmmm">Hmmm</label> 
                          </span>
                          
                          <!-- Inline radio buttons -->
                          <label class="colspan-6">Current Customer2?</label>
                          <div class="colspan-6">	
                              <input name="customer2" id="customer2-yes" value="yes" type="radio">
                              <label for="customer2-yes">Yes</label>
                              <input name="customer2" id="customer2-no" checked="checked" value="no" type="radio">
                              <label for="customer2-no">No</label>	
                          </div>
                          <!-- Inline radio buttons -->
                      </fieldset>
                 </form>
             </div><!--cols-6-->
          </div><!--colspan-6-->
       </div><!--cols-grid-->
      </div><!--panel-body-->
      <!--.panel-body-->
      <div class="panel-footer">
          <div class="center-block toggle_code" style="text-align:center;"></div>
          <div class="sourcecode" id="test">
              <code class="language-markup" >
                  <script type="prism-html-markup">
 <div class="cols-grid">
	  <div class="colspan-6">
		  <div class="cols-6">
			  <form class="form col-content" action="#forms.html" method="post">
				  <fieldset>
					 <label class="colspan-6">Do you like our service?</label>				
					  <span class="colspan-6">
						  <input name="service" id="service-yes" checked="checked" value="yes" type="radio">
						  <label for="service-yes">Yes</label> 
					  </span>
					  <span class="colspan-6">
						  <input name="service" id="service-no" value="no" type="radio">
						  <label for="service-no">No</label>
					  </span>
					  <span class="colspan-6">
						  <input name="service" id="service-hmmm" value="hmm" type="radio">
						  <label for="service-hmmm">Hmmm</label> 
					  </span>
					  
					  <!-- Inline radio buttons -->
					  <label class="colspan-6">Current Customer2?</label>
					  <div class="colspan-6">	
						  <input name="customer2" id="customer2-yes" value="yes" type="radio">
						  <label for="customer2-yes">Yes</label>
						  <input name="customer2" id="customer2-no" checked="checked" value="no" type="radio">
						  <label for="customer2-no">No</label>	
					  </div>
					  <!-- Inline radio buttons -->
				  </fieldset>
			 </form>
		 </div><!--cols-6-->
	 </div><!--colspan-6-->
</div><!--cols-grid-->
										
                                        </script>
                                    </code>
                                </div>
</div><!--panel-footer-->
                            
                            
                        </div>
                        <!--.panel-->

                     
                     <!-- Radio Button Boxes-->
 <div class="panel panel-default" id="radiobuttonboxes">
    <div class="panel-heading">
        <h3 class="panel-title">Radio Button Boxes</h3>
    </div>

    <div class="panel-body">
        <div class="cols-grid">
                <div class="col-content group-chooser">
                    <div class="colspan-m12 choice-gap group-choice"> 
                        <input type="radio" id="radio-1" name="radioboxgroup" class="hide-choice-input" value="radio-1">
                        <label for="radio-1">Total Due: </label>
                        <span class="mtext-align-center">
                            <span class="choice-value choice-field">$145.99</span>
                        </span>
                    </div>
                    <div class="colspan-m12 group-choice"> 
                        <input type="radio" id="radio-2" name="radioboxgroup" class="hide-choice-input" value="radio-2">
                        <label for="radio-2">Pay a Different Amount: </label>
                        <span class="mtext-align-center">
                            <input type="text" placeholder="" size="10" class="choice-value choice-field">
                        </span>
                    </div>
                </div>
        </div><!--cols-grid-->
    </div><!--panel-body-->
   <div class="panel-footer">
    <div class="center-block toggle_code" style="text-align:center;"></div>
    <div class="sourcecode" id="test">
    	<pre>
        <code class="language-markup" >
            <script type="prism-html-markup">
<div class="col-content group-chooser">
	<div class="colspan-m12 choice-gap group-choice"> 
		<input type="radio" id="radio-1" name="radioboxgroup" class="hide-choice-input" value="radio-1">
		<label for="radio-1">Total Due: </label>
		<span class="mtext-align-center">
			<span class="choice-value choice-field">$145.99</span>
		</span>
	</div>
	<div class="colspan-m12 group-choice"> 
		<input type="radio" id="radio-2" name="radioboxgroup" class="hide-choice-input" value="radio-2">
		<label for="radio-2">Pay a Different Amount: </label>
		<span class="mtext-align-center">
			<input type="text" placeholder="" size="10" class="choice-value choice-field">
		</span>
	</div>
</div>
			 </script>
        </code>
        </pre>
    </div><!--sourcecode-->
   </div><!--panel-footer-->   
 </div><!--panel-->
 
     		<!-- Google Places Form-->
 <div class="panel panel-default" id="radiobuttonboxes" id="bus_google_places_form">
    <div class="panel-heading">
        <h3 class="panel-title">Google Places Form</h3>
    </div>

    <div class="panel-body">
        <div class="cols-grid">
        	<div class="col-reset">
<div class="col-reset">
	<p>Access below link to see a working example of Google Places Form.</p>
	<a href="/ui/4_1/tsw/html/residential/digital-switch/Delivery-Details.html" target="_blank">Google Places Form Prototype Link</a>
</div>		
        </div>
    </div><!--panel-body-->
     <div class="panel-footer">
        <div class="center-block toggle_code" style="text-align:center;"></div>
        <div class="sourcecode" id="test">
            <pre>
            <code class="language-markup" >
                <script type="prism-html-markup">
				<div class="col-reset">
 <div class="col-reset">
	<p>Access below link to see a working example of Google Places Form.</p>
	<a href="/ui/4_1/tsw/html/residential/digital-switch/Delivery-Details.html" target="_blank">Google Places Form Prototype Link</a>
</div>		
                </script>
            </code>
            </pre>
        </div><!--sourcecode-->
    </div><!--panel-footer-->
 </div><!--panel-->
 
 
 
 </div><!--res_controls-->
 <br>