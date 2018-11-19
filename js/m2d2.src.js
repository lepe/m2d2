/**
 * @author: A. Lepe
 * @url : https://gitlab.com/lepe/m2d2/
 * @since: May, 2018
 * @version: 1.0.2 : 2018-11-19
 */
"use strict";
var m2d2 = (function() {
	// main function
	var m2d2 = function(options, callback) {
		if(callback != undefined) {
			options.onRenderDone = callback;
		}
		return new M2D2(options).get();
	};
	// Extensions:
	m2d2.ext = function(properties) {
		M2D2.prototype._ext = extend(M2D2.prototype._ext, properties);
	};
	//---- Class ---
	var M2D2 = function(options) {
		var model = this;
		if ( !(model instanceof M2D2) )  {
			model = new M2D2(options);
			return model;
		} else {
			// CUSTOM OPTIONS
			model = extend(model, options || {});
			if(model.auto_init) {
				model.init();
			}
		}
	}
	M2D2.prototype = {
		//------- options ---------------
		root            : "body",   // DOM baseline to perform searches and replacements. The outer element.
		auto_init       : true,     // If true, it will render automatically on initialization, otherwise, call render()
		html            : true,     // Auto detect and insert HTML instead of text
		data            : {},       // object to render. This object will be monitored for changes,
	//	template		: undefined,// root template. It can be a string (tagName, ID selector (#) or HTML) or an object. When not specified, it will be generated from array.
	//  events          : undefined,// if set, it will attach events to root. Example: { onclick : function(ev) {} , onkeyup : function(ev) {} }
		interval        : 0,        // how often to update data if data is a function.
									// ... Also can be set as second parameter when calling: callback(data, interval). 
									// ... After render, it will become the timer, so it can be stopped if required.
		//------- events ------------------
		preRender  : function(instance) {},       // This is executed before we start rendering
		beforeDataRender   : function(instance, $elem, row) {},  // This is executed just before rendering a row. "row" can be changed before it is rendered. (return false to skip)
		afterDataRender    : function(instance, $elem, row) {},  // This is executed just after rendering a row. "row" is not longer after this, so modifying it won't take any effect.
		postRender   : function(instance) {},       // This is executed after all has been rendered
		onRenderDone : function(data) {},
		//------- read only -----
		rendered        : false,    // true if the data has been rendered
		//----- accessible during rendering:
		$root           : null,     // root DOM element e.g. "<body>...</body>"
		//----- Public functions ----------------
		/**
		 * Initialize data. If its a function, call it.
		 * If "auto_init" is true, render.
		 */
		init : function() {
			var _this = this;
            if(isFunction(_this._data)) {
                _this._func = _this._data;
                _this.data = _this._doFunc(_this._func, _this.param, function(newData, refreshRate){
                    _this._onReady();
                    if(refreshRate === undefined) {
                        if(_this.interval*1 > 0) {
                            refreshRate = _this.interval;
                        }
                    }
                    if(refreshRate*1 > 0) {
                        _this.interval = setInterval(function(){
                            _this._func(function(updData) {
                                _this._doRender(_this.$root, updData);
                            });
                        }, refreshRate);
                    }
                });
            } else {
                // In case its a Number of String, wrap it.
                if(!isObject(this._data)) {
                    this._data = { text : this._data };
                }
                _this._onReady();
            }
		},
		/**
		 * Update model data
		 */
		update : function(data, property, valObj) {
			var _this = this;
			if(_this.rendered) {
				var doUpdate = function(data) {
					if(data._node != undefined) {
						var change = {}
						change[property] = valObj.value;
						_this._doRender(data._node, extend(data,change));
					} else {
						// Clear root element
						_this.clear();
						_this._doRender(_this.$root, data);
					}
				}
				if(property === undefined && isFunction(_this._func)) {
					_this._doFunc(_this._func, data, function(newData){
						doUpdate(newData);
					});
				} else {
					doUpdate(data);
				}
			}
		},
		/**
		 * Render data
		 */
		render : function() {
			var _this = this;
			if(_this._data == undefined) {
			    console.log("data is missing in m2d2 object. Be sure the key 'data' is set.")
			    return false;
			}
            // Initial trigger
            _this.preRender(_this);
            // Render data
            _this._doRender(_this.$root, _this._data);
            // Trigger on finish
            _this.postRender(_this);
            // Set trigger on modifications 
            _this.rendered = true;
            // When we are done
            _this.onRenderDone(_this.get());
		},
		/**
		 * Returns data object
		 */
		get : function() {
			var _this = this;
			_this._defineProp(_this._data, "m2d2", this);
            _this._setProxy();
			return this._data;
		},
		/**
		 * Removes added model items
		 */
		clear : function() {
			var _this = this;
			if(_this.rendered) {
				_this.$root.innerHTML = _this.cache;
			}
		},
		//---- Private --
		_cache : null,
		_data  : null,
		_func  : null,
		_ext   : {},
		// HTML5 valid attributes and tags (2018)
		_htmlGenTags : ["a","abbr","acronym","address","area","article","aside","audio","b","bdi","bdo","big","blockquote","body","br","button","canvas","caption","cite","code","col","colgroup","datalist","dd","del","details","dfn","div","dl","dt","em","embed","fieldset","figcaption","figure","footer","form","frame","frameset","h1","h2","h3","h4","h5","h6","head","header","hgroup","hr","html","i","img","input","ins","kbd","label","legend","li","map","mark","menu","meter","nav","ol","optgroup","option","output","p","pre","progress","q","rp","rt","ruby","samp","section","select","small","span","strong","sub","summary","sup","table","tbody","td","textarea","tfoot","th","thead","tr","tt","ul","var"],
        _onReady : function(_this) {
			var _this = this;
            _this.$root = node(_this.root);
            _this.cache = _this.$root.innerHTML;
            _this.render();
        },
		_doFunc : function(origFunc, param, callback) {
			var _this = this;
			var type = origFunc(function(newData, refreshRate){
				if(isObject(newData)) {
					// The first time, _this._data may be object. Fix it.
					if(isArray(newData) && isPlainObject(_this._data)) {
						_this._data = newData;
					} else {
						for(var n in newData) {
							_this._data[n] = newData[n];
						}
					}
				}
				if(callback != undefined) {
					callback(newData, refreshRate);
				}
			}, param) || (_this._getTemplate(node(_this.root), _this)) ? [] : {};
			if(!isPlainObject(type) &&! isArray(type)) {
			    console.log("Undefined type of 'data'. For automatic detection do not set any 'return' in the data's function. Or explicitly return '[]' for arrays or '{}' for objects.")
			}
			return type;
		},
        _setProxy : function(force) {
			var _this = this;
			if(_this._data._proxy === undefined && (isPlainObject(_this._data) || isArray(_this._data))) {
				_this._data = _this._proxy(_this._data, function(obj, variable, value) {
					if(variable != "m2d2" && variable[0] != '_') { //Do not update if it starts with '_'
						_this.update(obj, variable, value);
					}
				});
			}
        },
		// Render an element with its values
		_doRender : function($elem, value) {
			var _this = this;
			//Add events to root
			if(_this.events !== undefined) {
			    for(var e in _this.events) {
			        $elem[e] = _this.events[e];
			    }
			}
            _this._setProxy();
			if(isArray(value)) {
				_this._doArray($elem, _this, value);
			} else { //Number, String or Objects
				_this._setValues($elem, value);
			}
		},
		// Process an array
		_doArray : function($elem, obj, values) {
			var _this = this;
			var template = _this._getTemplate($elem, obj);
            for(var i = 0; i < values.length; i++) {
                var val = values[i];
                if(val._node != undefined) {
                    val._node = undefined;
                }
                if(!template) {
                    if(isPlainObject(val)) {
                        if(Object.keys(val).length == 1) {
                            if(isSelectorID(val)) {
                                var idNode = document.querySelector(val);
                                if(idNode) {
                                    template = idNode.outerHTML;
                                } else {
                                    console.log("Warning: ID selector for template not found: "+val+" . Object:");
                                    console.log(obj);
                                    return
                                }
                            } else {
                                template = newNode(Object.keys(val)[0]).outerHTML;
                            }
                        } else {
                            console.log("Warning: Multiple keys in data without template is not supported yet. Object:");
                            console.log(obj);
                            return
                        }
                    } else {
                        console.log("Warning: No template found for object:");
                        console.log(obj);
                        return
                    }
                }
                var $item = htmlNode(template);
                $item.setAttribute("data-id", i);
                $elem.append($item);
                _this._setValues($item, val);
            }
		},
		// Returns a copy of the model to duplicate
		// $elem is to search in DOM for <template>
		// obj is to search for property "template"
		_getTemplate : function($elem, obj) {
			var _this = this;
			if(obj._template != undefined) {
				return obj._template;
			} else {
				var $template;
				if(obj.template != undefined) {
					if(isPlainObject(obj.template)) {
						$template = newNode("div");
						_this._setValues($template, obj.template);
					} else if(isSelectorID(obj.template)) {
					    $template = document.querySelector(obj.template);
					} else if(isHtml(obj.template)) {
						$template = htmlNode("<div>"+obj.template+"</div>");
					} else {
					    $template = htmlNode("<div>"+newNode(obj.template).outerHTML+"</div>");
					}
				} else {
					$template = node("template", $elem);
				}
				// If not template is found, use html as of element
				if($template) {
					var html = $template.innerHTML.trim();
					_this._defineProp(obj, "_template", html);
					return html;
				} else {
					return $elem.innerHTML.trim();
				}
			}
		},
		// Set values in elements
		_setValues : function($elem, value) {
			var _this = this;
			if(isPlainObject(value)) {
				_this._setNode($elem, value);
				for(var key in value) {
				    var item = value[key];
                    // Arrays
                    if(key == "data") {
                        _this._doArray($elem, value, item);
                    } else if(key == "template") {
                        // If it contains a template property, add it as HTML
                        $elem.innerHTML = "<template>" + _this._getTemplate($elem, value) + "</template>";
                    } else {
						// Apply extensions:
						if(_this._ext[key] != undefined && isFunction(_this._ext[key])) {
							var ret = _this._ext[key](item, $elem);
							if(ret) {
								_this._setValues($elem, ret);
							}
						// ID defined:
						} else if(key[0] == "#") { 
							_this._doRender(node(key), item);
						// Text or Html specified:
						} else if(key == "text" || key == "html") {
							_this._setValue($elem, key, item);
						// Import dataset: Setting dataset : { id : 'custom' } will override the id set automatically in arrays.
						} else if(key == "dataset" && isPlainObject(item)) {
                            for(var d in item) {
                                $elem.setAttribute("data-"+d, item[d]);
                            }
                        // Events
						} else if(key.indexOf("on") == 0 && isFunction(item)) {
							$elem[key] = item;
						// Date / Time:
						} else if(item instanceof Date) {
							_this._setValue($elem, key, item);
						// Attributes: --Do not set ID with a numeric value
						} else if(_this._hasAttr($elem, key) && !(key == "id" && isNumeric(item))) {
							$elem.setAttribute(key, item);
						// Search child elements:
						} else {
						    // Search by tag name first
							var $subelem = node(key, $elem);
							if(!$subelem) {
							    // Search by ID
								$subelem = node("#"+key, $elem);
								if(!$subelem) {
								    // Search by class
								    $subelem = node("."+key, $elem);
								}
								if(!$subelem) {
									// Generate new element:
									if(_this._htmlGenTags.indexOf(key) != -1) {
										var $newElem = newNode(key);
										$elem.append($newElem);
										_this._doRender($newElem, item);
									// Set a new attribute:
									} else if(!isNumeric(key)) {
										$elem.setAttribute(key, item);
									}
									continue;
								}
							}
							_this._doRender($subelem, item);
						}
					}
				}
			//String or Number
			} else {
				_this._setValue($elem, null, value);
			}
		},
		// Set value for a single element (in case of number, string, boolean, etc)
		_setValue : function($elem, key, value) {
			var _this = this;
			// If key is null, it means is not specified, so we try to guess what it is
            var html = false;
            if(key == null) {
                if(value == undefined || value == null) {
                    console.log("Value was undefined in element :");
                    console.log($elem);
                } else if(isPlainObject(value) && value.text !== undefined) {
                    value = value.text;
                } else if(!isNumeric(value) && isHtml(value)) {
                    html = true;
                }
            } else if(key == "html") {
                html = true;
            }
			if(html) {
				$elem.innerHTML = value;
			} else {
                 // As <li> can have "value", it won't be assigned if key is null
                if(key == "value" || (key == null && _this._hasAttr($elem, "value") && ($elem.tagName != "LI"))) {
					if(_this._hasAttr($elem, "checked")) {
						if(value == true || value == "true" || value == 1) {
							$elem.setAttribute("checked",true);
						} else if(value == false || value == "false" || value == 0) {
							$elem.setAttribute("checked",false);
						} else {
							$elem.value = value;
						}
					} else if(value instanceof Date) {
						$elem.valueAsDate = value;
					} else {
						$elem.value = value;
					}
				} else {
					// If the element has children, only change text
					if($elem.childElementCount > 0) {
                        for(var i in $elem.childNodes) {
                            var inode = $elem.childNodes[i];
                            if(inode.nodeType == 3) {
							    inode.replaceWith(value);
                                return;
                            }
                        }
                        // If text node not found, append it
						$elem.innerHTML = $elem.innerHTML + value; //TODO: not the best way IMHO
					} else {
						$elem.innerText = value;
					}
				}
			}
		},
		_hasAttr : function($node, attr) {
			var hasAttr = false;
            if($node && !isNumeric(attr)) {
                switch(attr) {
                    case "checked":
                        hasAttr = ($node.type != undefined && ($node.type == "radio" || $node.type == "checkbox"));
                    break;
                    default:
                        hasAttr = $node[attr] != undefined || $node.hasAttribute(attr);
                }
            }
			return hasAttr;
		},
		_defineProp: function(obj, prop, def) {
			if(isObject(obj)) {
				if(obj[prop] === undefined) {
					Object.defineProperty(obj, prop, {
						enumerable: false,
						writable: true
					});
					obj[prop] = def;
				}
			}
		},
		_setNode: function($node, obj) {
			this._defineProp(obj, "_node", $node);
		},
		_proxy : function(obj, onChange) {
			this._defineProp(obj, "_proxy", true);
			var handler = {
				get : function(target, property, receiver) {
					if(property == "m2d2" || property[0] == '_') {
						return target[property];
					} else {
						try {
							if(isArray(obj) && !isNumeric(property)) {
								return target[property];
							} else {
								return new Proxy(target[property], handler);
							}
						} catch (err) {
							return Reflect.get(target, property, receiver);
						}
					}
				},
				defineProperty : function(target, property, descriptor) {
					onChange(target, property, descriptor);
					return Reflect.defineProperty(target, property, descriptor);
				},
				deleteProperty : function(target, property) {
					onChange(target, property);
					return Reflect.deleteProperty(target, property);
				},
				set : function(target, property, value) {
					target[property] = value;
					onChange(target, property, { value: value });
					return true;
				}
			}
			return new Proxy(obj, handler);
		},
		//----- setters and getters for data
		set data(value) {
			var _this = this;
			_this._data = value;
			_this.update(_this._data);
		},
		get data() {
			var _this = this;
			return _this._data;
		}
	}
	// ------- Functions -------
	// from: https://stackoverflow.com/questions/11197247
	function extend() {
	    for(var i=1; i<arguments.length; i++) {
	        for(var key in arguments[i]) {
		        if(arguments[i].hasOwnProperty(key)) {
			        arguments[0][key] = arguments[i][key];
				}
			}
		}
	    return arguments[0];
	}
	var isHtml = function(s) {
	    return (s + "").trim().indexOf("<") !== -1;
	}
    var isFunction = function(f) {
        return typeof f === 'function';
    }
    var isArray = function(a) {
        return Array.isArray(a);
    }
    var isObject = function(oa) {
        return typeof oa === 'object';
    }
    var isPlainObject = function(o) {
        return isObject(o) &&! isArray(o);
    }
    var isSelectorID = function(s) {
        return (s + "").trim().indexOf("#") == 0;
    }
    var isNumeric = function(n) { 
        return !isNaN(parseFloat(n)) && isFinite(n); 
    }
    var node = function(selector, root) {
        if(root === undefined) { root = document; }
        return root.querySelector(selector);
    }
    var newNode = function(tagName) {
        return document.createElement(tagName);
    }
    var htmlNode = function(html) {
        var template = newNode("template");
        template.innerHTML = html.trim();
        return template.content.firstChild;
    }
	return m2d2;
})();
