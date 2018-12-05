var graph = null;

define('goi-machine',
	function(require) {
		var Flag = require('token').RewriteFlag();

		var Variable = require('ast/var');
		var Operation = require('ast/operation');
		var Binding = require('ast/binding');
		var Reference = require('ast/reference');
		var Thunk = require('ast/thunk');

		var Lexer = require('parser/lexer');
		var Parser = require('parser/parser');

		var MachineToken = require('token');
		var Link = require('link');

		var Graph = require('graph');
		var Group = require('group');
		var Term = require('term');

		var Atom = require('nodes/atom');
		var Contract = require('nodes/contract');
		var Start = require('nodes/start');
		var Op = require('nodes/op');

		var IntOp = require('nodes/ops/int');
		var BoolOp = require('nodes/ops/bool');
		var PlusOp = require('nodes/ops/plus');
		var TimesOp = require('nodes/ops/times');
		var AndOp = require('nodes/ops/and');
		var OrOp = require('nodes/ops/or');
		var NotOp = require('nodes/ops/not');
		var EqualsOp = require('nodes/ops/equals');
		var IfOp = require('nodes/ops/if');

		class GoIMachine {

			constructor() {
				this.setMachine(new Graph(),new MachineToken(),0);
			}

			setMachine(graphSet,tokenSet,countSet) {
				this.graph = graphSet;
				graph = this.graph; // cheating!
				this.token = tokenSet;
				this.count = countSet;
			}

			compile(source) {
				const lexer = new Lexer(source + '\0');
				const parser = new Parser(lexer);
				const ast = parser.parse();
				this.count = 0;

				this.graph.clear();
				var start = new Start().addToGroup(this.graph.child);
				var term = this.toGraph(ast).addToGroup(this.graph.child);
				var link = new Link(start.key, term.prin.key, "_", "_").addToGroup(this.graph.child);
				this.token.reset(link);
			}

			// translation
			toGraph(ast) {
				var graph = this.graph;

				var term = new Term();
				if (ast instanceof Thunk) {
					term.box();
					ast = ast.inner;
				}

				// VARIABLES & ATOMS
				if (ast instanceof Variable) {
					var auxs = [];
					var prin = null;
					console.log(prin);
					for (var i = 0; i < ast.ctx.length; i++) {
						var c = new Contract().addToGroup(term);
						auxs.push(c);
						if ((ast.ctx[i]).name == ast.name)
						 	prin = c;
					}
					console.log(prin);
					term.set(prin, auxs);

				// BINDINGS & REFERENCES
				} else if ((ast instanceof Binding) || (ast instanceof Reference))  {
					var body = this.toGraph(ast.body, term, false).addToGroup(term);
					var param = this.toGraph(ast.param, term, false).addToGroup(term);

					var auxs = body.auxs;
					var auxNode = auxs[0];
					auxs.splice(0,1)
					auxs = auxs.concat(param.auxs);

					if (ast instanceof Reference) {
						var atomNode = new Atom("a").addToGroup(param);
						new Link(atomNode.key, param.prin.key, "_", "_").addToGroup(param);
						param.prin = atomNode;
					}
					new Link(auxNode.key, param.prin.key, "_", "_").addToGroup(term);

					auxs = Contract.createDNet(ast.ctx.length, auxs, term);
					term.set(body.prin, auxs);

				// OPERATIONS
				} else if (ast instanceof Operation) {
					var op = this.toOp(ast.name,ast.active).addToGroup(term);

					var auxs = [];

					var next;
					for (var i = 0; i < ast.sig[0]; i++) {
						next = this.toGraph(ast.eas[i], term).addToGroup(term);
						new Link(op.key, next.prin.key, "_", "_").addToGroup(term);
						auxs = auxs.concat(next.auxs);
					}
					for (var i = 0; i < ast.sig[1]; i++) {
						next = this.toGraph(ast.das[i], term).addToGroup(term);
						var link = new Link(op.key, next.prin.key, "_", "_");
						link.visited = true; // hacking
						link.addToGroup(term);
						auxs = auxs.concat(next.auxs);
					}

					auxs = Contract.createDNet(ast.ctx.length, auxs, term, op);
					term.set(op, auxs);
				}
				return term;
			}

			toOp(name,active) {
				if (Number.isInteger(parseInt(name))) {
					return new IntOp(name);
				} else if (name == "true" || name == "false") {
					return new BoolOp(name);
				} else if (name == "+") {
					return new PlusOp();
				} else if (name == "*") {
					return new TimesOp();
				} else if (name == "∧") {
					return new AndOp();
				} else if (name == "∨") {
					return new OrOp();
				} else if (name == "¬") {
					return new NotOp();
				} else if (name == "==") {
					return new EqualsOp();
				} else if (name == "if") {
					return new IfOp();
				} else {
					return new Op(name,active);
				}
			}

			quotieningRules() {
				// TODO
				// Loop through all links in the graph
				// Perform quotiening rules
				return null;
			}

			// machine step
			transition(graphTxt, linkTxt, flagTxt) {
				if (!finished) {
					this.count++;
					var node = this.graph.findNodeByKey(this.token.link.to);

					var nextLink;
					if (this.token.rewriteFlag == Flag.REWRITE) {
						nextLink = node.rewrite(this.token);
					} else {
						nextLink = this.pass(this.token);
					}
					if (nextLink != null) {
						this.token.setLink(nextLink);
						this.printHistory(graphTxt, linkTxt, flagTxt);
					} else {
						this.token.setLink(null);
						play = false;
						playing = false;
						finished = true;
					}
				}
			}

			printHistory(graphTxt, linkTxt, flagTxt) {
				graphTxt.val(this.graph.draw().replace(/\n/g, "") + '\n' + graphTxt.val());
				linkTxt.val(this.token.link + '\n' + linkTxt.val());
				flagTxt.val(this.token.rewriteFlag + '\n' + flagTxt.val());
			}

		pass(token) { // this needs cleaning up!
			var link = token.link;
			if (token.rewriteFlag == Flag.SEARCH) {
				var to = this.graph.findNodeByKey(link.to);
				var outlinks = to.findLinksOutOf();
				if (to instanceof Atom) {
					token.rewriteFlag = Flag.RETURN;
					return link;
				} else if (to instanceof Op) {
					if (outlinks.length == 0) {
						if (to.active) {
							token.rewriteFlag = Flag.REWRITE;
						} else {
							token.rewriteFlag = Flag.RETURN;
						}
						return link;
					} else {
						var j = this.findJ(link,outlinks);
						return outlinks[j];
					}
				} else if (to instanceof Contract) {
					token.rewriteFlag = Flag.REWRITE;
					return link;
				}
			} else if (token.rewriteFlag == Flag.RETURN) {
				var from = this.graph.findNodeByKey(link.from);
				var outlinks = from.findLinksOutOf();
				if (this.doneVisiting(link,outlinks)) { // HACKING
					if (from.active) {
						token.rewriteFlag = Flag.REWRITE;
						return from.findLinksInto()[0];
					} else {
						token.rewriteFlag = Flag.RETURN;
						return from.findLinksInto()[0];
					}
				} else {
					token.rewriteFlag = Flag.SEARCH;
					var j = this.findJ(link,outlinks);
					return outlinks[j];
				}
			}
			return link;
		}

		doneVisiting(link, links) {
			links = links.filter(x => !this.graph.findNodeByKey(x.to).group.boxed);
			for (let l of links) {
				if ((!l.visited) && (l != link))
					return false;
				}
			return true;
			}

		findJ(link,list) {
			for (var j = 0; j < list.length; j++) {
				if ((!list[j].visited) && (list[j] != link))
					return j;
			}
			return null;
		}

	}

		return GoIMachine;
	}
);
