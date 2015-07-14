<?php
function generate_inline_script($scripts){
	?>
	<script type="text/javascript">
		asyncScripts = <?php echo !empty($scripts) ? json_encode($scripts) : "[]";?>;
		function execDelayedScripts(){
			if (scriptsToLoad<=0){
				for (var i = 0; i < asyncFunctions.length; i++){
					asyncFunctions[i]();
				}
			}else{
				setTimeout(execDelayedScripts,100);
			}
		}

		function loadAsyncScript(script){
			if (typeof(script.deps) == 'object'){
				for (var i = 0; i < script.deps.length; i++){
					if (!include(loadedScripts,script.deps[i])){

						setTimeout(function (){
							loadAsyncScript(script);
						},100);
						return;
					}
				}
			}
			if (script.extra!=''){
				var extra = document.createElement("script");
				extra.setAttribute('type','text/javascript');
				extra.innerHTML = script.extra;
				document.body.appendChild(extra);
			}


			if (script.src!=''){
				var element = document.createElement("script");
				element.setAttribute('type','text/javascript');
				element.src = decodeURIComponent(script.src.replace(/\+/g, ' '));

				onload(element,function(){
					scriptsToLoad--;
					loadedScripts.push(script.name);
				});

				document.body.appendChild(element);
			}else{
				scriptsToLoad--;
				loadedScripts.push(script.name);
			}
		}

		var include = Array.prototype.indexOf
			?
				function(arr, obj) { return arr.indexOf(obj) !== -1; }
			:
				function(arr, obj) {
					for(var i = -1, j = arr.length; ++i < j;)
					if(arr[i] === obj) return true;
					return false;
				};

		scriptsToLoad =  asyncScripts.length;
		for (var i = 0; i < asyncScripts.length; i++){
			loadAsyncScript(asyncScripts[i]);
		}

		function documentReady() {
			execDelayedScripts();
		}

		function onload(element,func){
			if (element.addEventListener){
				element.addEventListener("load", func, false);
			}else if (element.attachEvent){
				element.attachEvent("onload", func);
			}else{
				element.onload = func;
			}
		}

		onload(window,documentReady);
	</script>
	<?php
}


function get_script_with_deps($script){
	global $wp_scripts;

	if (is_string($script)){
		$script = $wp_scripts->registered[$script];
	}

	$return = array();
	if (!empty($script->deps)){
		foreach ($script->deps as $dep){
			$dep_with_deps = get_script_with_deps($dep);
			$return = array_merge($dep_with_deps,$return);
		}
	}
	array_push($return, $script->handle);

	return $return;
}

function get_ordered_script_list(){
	global $wp_scripts;

	$loaded = get_exceptions_script_names();
	$remove_GET_part = get_option('ajc_remove_GET_part');


	// FIX: adding jquery-core dependency for jquery-migrate
	if (isset($wp_scripts->registered['jquery-migrate']) && !in_array('jquery-core',$wp_scripts->registered['jquery-migrate']->deps)){
		$wp_scripts->registered['jquery-migrate']->deps[] = 'jquery-core';
	}

	$list = array();
        if (is_array($wp_scripts->queue)){
                foreach ($wp_scripts->queue as $script){
                        $script_with_deps = get_script_with_deps($script);
                        $list = array_merge($list,$script_with_deps);
                }
        }

	$clean_list = array();
	$script_list = array();
	foreach ($list as $name){
		if (!in_array($name,$clean_list) && !is_excluded($name)){
			$clean_list[] = $name;

			$script = $wp_scripts->registered[$name];

			if ($script->src!='' && strpos($script->src,'http')!==0 && strpos($script->src,'//')!==0){
				$script->src = rtrim(get_bloginfo('wpurl'),'/').'/'.ltrim($script->src,'/');
			}

			$item = array(
				'name'	=> $name,
				'src' 	=> $script->src=='' ? '' : $script->src.((!empty($script->ver) && !$remove_GET_part) ? '?ver='.$script->ver : '')
			);
			if (!empty($script->deps)){
				$item['deps'] = $script->deps;
			}
			$extra = get_script_extra($script);
			if (!empty($extra)){
				$item['extra'] = $extra;
			}
			$script_list[] = $item;
		}
	}

	//~ var_dump($script_list);
	return $script_list;
}



function get_script_extra($script){
	if (!is_array($script->extra)){
		return "";
	}
	$extra = "";
	foreach ($script->extra as $key=>$value){
		switch ($key){
			case "l10n":{
				$extra .= "var {$value[0]} = ".json_encode($value[1]);
				break;
			}
			case "group": {
				continue;
				break;
			}
			case "data":
			default:{
				$extra .= $value;
			}
		}
	}
	return $extra;
}

function unregister_all_scripts(){
	global $wp_scripts;
	if (isset($wp_scripts->queue) && is_array($wp_scripts->queue)){
		foreach ($wp_scripts->queue as $script){
			if (is_excluded($script)){
				continue;
			}
			wp_dequeue_script($script);
			wp_deregister_script( $script);
		}
	}
}

function get_styles_list(){
	global $wp_styles;
	$list = array();
	if (isset($wp_styles->queue) && is_array($wp_styles->queue)){
		foreach ($wp_styles->queue as $style){
			if (is_excluded($style)){
				// is in esclusion list
			}else{
				$list[] = array(
					'src'		=> $wp_styles->registered[$style]->src,
					'media'	=> $wp_styles->registered[$style]->args
				);
			}
		}
	}
	return $list;
}

function unregister_all_styles(){
	global $wp_styles;
	if (isset($wp_styles->queue) && is_array($wp_styles->queue)){
		foreach ($wp_styles->queue as $style){
			if (is_excluded($style)){
				continue;
			}
			wp_dequeue_style($style);
			wp_deregister_style( $style);
		}
	}
}

function inline_css($url,$minify=true){
	$base_url = get_bloginfo('wpurl');
	$path = false;

	if (strpos($url,$base_url)!==FALSE){
		$path = str_replace($base_url,rtrim(ABSPATH,'/'),$url);
	}elseif ($url[0]=='/' && $url[1]!='/'){ // url like /wp-conten/... and not like //google.com/...
		$path = rtrim(ABSPATH,'/').$url;
		$url = $base_url.$url;
	}

	if ($path && file_exists($path)){
		$css = file_get_contents($path);

		if ($minify){
			$css = minify_css($css);
		}

		$css = fix_css_urls($css,$url);

		echo $css;
		return true;
	}else{
		//~ echo "/* !!! can not open file {$url}[{$path}] !!! */";
		return false;
	}
}

function fix_css_urls($css,$url){
	$css_dir = substr($url,0,strrpos($url,'/'));

	//~ $css = preg_replace("/url\(['\"]?([^\/][^'\"\)]*)['\"]?\)/i","url('{$css_dir}/$1')",$css);
	//~ $css = preg_replace("/url\(['\"]?([^\/][^'\"\)]*)['\"]?\)/i","url({$css_dir}/$1)",$css);
	$css = preg_replace("/url\((?!data:)['\"]?([^\/][^'\"\)]*)['\"]?\)/i","url({$css_dir}/$1)",$css);

	return $css;
}

function minify_css($css){
        $css = remove_multiline_comments($css);
	$css = str_replace(array("\t","\n","\r"),' ',$css);
	$cnt = 1;
	while ($cnt>0){
		$css = str_replace('  ',' ',$css,$cnt);
	}
	$css = str_replace(array(' {','{ '),'{',$css);
	$css = str_replace(array(' }','} ',';}'),'}',$css);
	$css = str_replace(': ',':',$css);
	$css = str_replace('; ',';',$css);
	$css = str_replace(', ',',',$css);
	return $css;
}

function remove_multiline_comments($code,$method=0){
        switch ($method){
                case 1:{
                        //~ $code = preg_replace("/\/\*[^\*\/]*\*\//","/*--*/",$code);
                        $code = preg_replace( '/\s*(?!<\")\/\*[^\*]+\*\/(?!\")\s*/' , '' , $code );
                        break;
                }
                case 0:
                default :{
                        $open_pos = strpos($code,'/*');
                        while ($open_pos!==FALSE){
                                $close_pos = strpos($code,'*/',$open_pos)+2;
                                if ($close_pos){
                                        $code = substr($code,0,$open_pos) . substr($code,$close_pos);
                                }else{
                                        $code = substr($code,0,$open_pos);
                                }

                                $open_pos = strpos($code,'/*',$open_pos);
                        }
                        break;
                }
        }

        return $code;
}

function get_exceptions(){
	global $wp_scripts;
	$array = explode("\n",get_option('ajc_exceptions'));
	$exceptions = array();
	foreach ($array as $key=>$ex){
		if (trim($ex)!=''){
			$exceptions[$key] = trim($ex);
		}
	}
	return $exceptions;
}

function get_exceptions_script_names(){
	global $wp_scripts;
	global $wp_styles;
	$exceptions = get_exceptions();
	$names = array();
	foreach ($exceptions as $file){
		if (is_string($file) && isset($wp_scripts->registered[$file])){
			$names[] = $wp_scripts->registered[$file]->handle;
		}elseif(is_array($wp_scripts->queue)){
			foreach ($wp_scripts->queue as $q){
				if (strpos($wp_scripts->registered[$q]->src,$file)!==FALSE){
					$names[] = $wp_scripts->registered[$q]->handle;
				}
			}
		}
	}
	return $names;
}

function is_excluded($file){
	global $wp_styles;
	global $wp_scripts;

	$exceptions = get_exceptions();

	if (is_string($file) && isset($wp_scripts->registered[$file])){
		$filename = $file;
		$file = $wp_scripts->registered[$file];
		//~ unset($wp_scripts->registered[$filename]->deps);
	}elseif(is_string($file) && isset($wp_styles->registered[$file])){
		$filename = $file;
		$file = $wp_styles->registered[$file];
		//~ unset($wp_styles->registered[$filename]->deps);
	}elseif(is_string($file)){
                if (is_array($wp_scripts->queue)){
                        foreach ($wp_scripts->queue as $q){
                                if (strpos($wp_scripts->registered[$q]->src,$file)!==FALSE){
                                        $file = $wp_scripts->registered[$q];
                                        //~ unset($wp_scripts->registered[$q]->deps);
                                        break;
                                }
                        }
                }
                if (is_array($wp_styles->queue)){
                        foreach ($wp_styles->queue as $q){
                                if (strpos($wp_styles->registered[$q]->src,$file)!==FALSE){
                                        $file = $wp_styles->registered[$q];
                                        //~ unset($wp_styles->registered[$q]->deps);
                                        break;
                                }
                        }
                }
	}

	foreach ($exceptions as $ex){
		if ($file->handle==$ex || (strpos($ex,'.')!==FALSE && strpos($file->src,$ex)!==FALSE)){
			return true;
		}
	}

	return false;
}

?>