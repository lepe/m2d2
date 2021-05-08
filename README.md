# M2D2 JS (Model to DOM 2)

A class to easily place data in DOM and update them immediately upon change. It has no dependencies. It is similar to Angular, Vue, ReactJS and alike frameworks and shares some similarities with JQuery.

The main goal of this framework is to keep the HTML and JS pure and clean, without having to either setup rules in the HTML (like in Angular), use HTML templates inside Javascript like in React, or use mixed templates like Vue. 

If you know Javascript and HTML you pretty much know 98% of M2D2 already. 
Because of that, it has a small learning curve, so you don't need to spend hours trying to understand
how the framework works or how you can apply it to your work.

This framework can work together with any other as it is just pure Javascript. Although, once you use it, you will like how clean your code can be.

Framework/Library comparison:

|        		 		 	| M2D2 | JQuery | Angular | ReactJS | Vue   |
| ------------------------- | ---- | ------ | ------- | ------- | ----- |
| Size  		  			| 16Kb |  88Kb  |  60Kb   | 166Kb   | 181Kb |
| Easy to learn   			|  Yes |  Yes   |   No    |   No    |  No   |
| Clean and standard HTML 	|  Yes |  Yes   |   No    |   Yes   |  No   |
| Clean Javascript    		|  Yes |  Yes   |   Yes   |   No    |  Yes  |
| Good for small projects   |  Yes |  Yes   |   No    |   Yes   |  Yes  |
| Good for large projects   |  Yes |  No    |   Yes   |   Yes   |  Yes  |
| Observe object changes    |  Yes |  No    |   Yes   |   Yes   |  Yes  |
| Large community           |  No  |  Yes   |   Yes   |   Yes   |  Yes  |
| CDN available             |  No  |  Yes   |   Yes   |   Yes   |  Yes  |

Repositories (synchronized):

* https://gitlab.com/lepe/m2d2/
* https://github.com/lepe/m2d2/


## Hello World

```js
    // When DOM is ready...
	m2d2.ready($ => {
		// Place text in #myid :
		$(myid, "Hello World");
	});
```


## Tutorial:
[Learn it Now](https://gl.githack.com/lepe/m2d2/raw/master/examples/tutorial/index.html)

## Live Demo:
[Try it Now](https://gl.githack.com/lepe/m2d2/raw/master/index.html)

## Install:

* Using npm:

`npm i m2d2`

or:

* Download (~16Kb): [m2d2.min.js](https://gl.githack.com/lepe/m2d2/raw/master/dist/m2d2.min.js) and set it in the HTML head.

## What's New in version 2.0:

This library was almost completely rewritten in v2.0. The main difference is that in 1.x, the M2D2 object was mainly a Proxy object which upon change, updated the DOM. However the main issue was that if you changed the DOM directly, there was no way to update the M2D2 object automatically, and thus could have side effects. In 2.x, the M2D2 object is a Node/HTMLElement wrapped around a Proxy and extended, which means that you can safely change the DOM directly without having side effects. Because now the M2D2 object is a DOM element, you have access to everything through vanilla javascript (like classList, appendChild, style, etc), which greatly simplified things.

Other big difference with v2.0 is that you can split your code across several small files in a very easy way (very useful if you use tools like 'gulp' to concatenate and minify your code).
