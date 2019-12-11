import * as d3 from "d3";
import error from "./errosMsgs";
import history from "./history";

const WIDTH = 1000;
const HEIGHT = 800;

export const actionsType = {
  add: "addNode",
  addIn: "addNodeIn",
  addOut: "addNodeOut",
  remove: "removeNode",
  addBalance: "addBalance",
  removeBalance: "removeBalance",
  edit: "editNode",
  undo: "undo",
  redo: "redo",
  save: "save",
  reset: "reset",
  config: "config",
  mini: "mini",
  orientation: "orientation",
  nodeh: "nodeh",
  nodew: "nodew"
};

export const nodesType = {
  in: 1,
  out: 0
};

const nodesTypeName = {
  in: "Tratamento",
  out: "Produção"
};

const DEFAULT = {
  name: "",
  description: "",
  class: "",
  resource: "",
  unit: "",
  category: "",
  duration: "",
  factor: "",
  circleSize: 26,
  nodeh: 60,
  nodew: 80,
  orientationTree: "top"
};

const orientationTree = {
  top: {
    size: [WIDTH, HEIGHT],
    x: function(d) {
      return d.x;
    },
    y: function(d) {
      return d.y;
    }
  },
  right: {
    size: [HEIGHT, WIDTH],
    x: function(d) {
      return 0 - d.y;
    },
    y: function(d) {
      return d.x;
    }
  },
  bottom: {
    size: [WIDTH, HEIGHT],
    x: function(d) {
      return d.x;
    },
    y: function(d) {
      return 0 - d.y;
    }
  },
  left: {
    size: [HEIGHT, WIDTH],
    x: function(d) {
      return d.y;
    },
    y: function(d) {
      return d.x;
    }
  }
};

class D3Tree {
  constructor() {
    this.circleColor0 = "#009933";
    this.circleColor1 = "#003399";
    this.data = null;
    this.root = null;
    this.circleSize = DEFAULT.circleSize;
    this.nodeh = DEFAULT.nodeh;
    this.nodew = DEFAULT.nodew;
    this.selectedOrientationTree = DEFAULT.orientationTree;
    this.counterBalanceClick = 0;
    this.counterBalance = 1;
    this.balanceClicked = {
      id: -1,
      d: null
    };
    this.sizeLabel = 5;
    this.orientation = orientationTree[this.selectedOrientationTree];
    this.optionSelect = {};
    this.modal = false;
    this.json = null;
  }

  /**
   * Retorna um json com o estado atual da árvore
   */
  getJsonData() {
    return JSON.stringify(this.data);
  }

  /**
   * Salva uma copia do json recebido da plataforma P+P
   */
  setJsonFromPP(json) {
    this.json = json;
  }

  /**
   * Configura função que vai apresentar os erros na tela
   */
  setHandleError(error) {
    this.error = error;
  }

  /**
   * Configura função que vai ser executada quando o usuário clicar em um nó
   */
  setHandleClickFunction(click) {
    this.handleClickFunction = click;
  }

  /**
   * Configura função que vai ser executada quando o usuário clicar em um nó
   */
  setModalstate(state) {
    this.modal = state;
  }

  /**
   * Muda a orientação da arvore
   */
  changeOrientationTree(newOrientation) {
    console.log("Muda a orientação da arvore");
    console.log(newOrientation);
    this.selectedOrientationTree = newOrientation;
    this.orientation = orientationTree[this.selectedOrientationTree];
    this.redrawTree(true);
  }

  /**
   * Muda nodeh que afeta a distância entre os nós irmãos
   */
  changeNodeh(newValue) {
    this.nodeh = newValue;
    this.redrawTree(true);
  }

  /**
   * Muda nodew que afeta a distância entre pai e filho
   */
  changeNodew(newValue) {
    this.nodew = newValue;
    this.redrawTree(true);
  }

  /**
   * Configura os atributos para edição e as cores das classes
   */
  setAttributesSelectAndColor(attributes) {
    this.optionSelect = attributes;
    DEFAULT.class = this.optionSelect.class[0].text;
    DEFAULT.resource = this.optionSelect.resource[0].text;
    DEFAULT.unit = this.optionSelect.resource[0].unit;
    DEFAULT.category = this.optionSelect.resource[0].category;
    DEFAULT.duration = this.optionSelect.duration[0].text;
    DEFAULT.factor = this.optionSelect.factor[0].text;
  }

  /**
   * Prepara os dados utilizados para desenhar a árvore, caso tenha algo salvo
   * no localstorage esse dado sera carregado
   */
  inicializeData(reset) {
    this.data = {
      name: "A1",
      description: DEFAULT.description,
      value: 1, //
      class: DEFAULT.class,
      resource: DEFAULT.resource,
      unit: DEFAULT.unit,
      category: DEFAULT.category,
      duration: DEFAULT.duration,
      factor: DEFAULT.factor,
      children: [
        {
          name: "B1",
          description: DEFAULT.description,
          value: 1,
          class: DEFAULT.class,
          resource: DEFAULT.resource,
          unit: DEFAULT.unit,
          category: DEFAULT.category,
          duration: DEFAULT.duration,
          factor: DEFAULT.factor,
          children: []
        }
      ]
    };

    if (reset === false && this.json.simulationData.graph.root[0] === "n") {
      console.log("Json novo");
      this.readJsonPP(this.json);
    } else {
      console.log("JSON modelo antigo ignorando simulationData");
      this.load();
    }

    history.saveState(this.data);
  }

  /**
   * Adiciona o SVG na div fluxograma e centraliza a posição da árvore e
   * habilidade a opção de zoom
   */
  createElementBaseForD3() {
    let svg = d3
      .select(".fluxograma")
      .append("svg")
      .attr("width", window.innerWidth)
      .attr("height", window.innerHeight)
      .call(
        d3.zoom().on("zoom", function() {
          svg.attr("transform", d3.event.transform);
        })
      )
      .call(
        d3.zoom().transform,
        d3.zoomIdentity.translate(window.innerWidth / 2 - 16, 50).scale(1)
      )
      .append("g")
      .attr(
        "transform",
        "translate(" + (window.innerWidth / 2 - 16) + "," + 50 + ")"
      );
    svg.append("g").attr("class", "links");
    svg.append("g").attr("class", "nodes");
  }

  /**
   * Cria o modelo de desenho das duas flechas no SVG (start-arrow, end-arrow)
   */
  createArrowModelToPath() {
    d3.select("svg")
      .append("svg:defs")
      .append("svg:marker")
      .attr("id", "end-arrow")
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 25) // Distancia da seta em relação a origem
      .attr("markerWidth", 5)
      .attr("markerHeight", 5)
      .attr("orient", "auto")
      .append("svg:path")
      .attr("d", "M0,-5L10,0L0,5")
      .attr("fill", "#009933");
    d3.select("svg")
      .append("svg:defs")
      .append("svg:marker")
      .attr("id", "start-arrow")
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 25) // Distancia da seta em relação a origem
      .attr("markerWidth", 5)
      .attr("markerHeight", 5)
      .attr("orient", "auto")
      .append("svg:path")
      .attr("d", "M0,-5L10,0L0,5")
      .attr("fill", "#003399");
  }

  /**
   * Constroi o modelo inicial da árvore
   */
  build() {
    this.inicializeData();
    this.createElementBaseForD3();
    this.createArrowModelToPath();
    this.drawTree();
  }

  /**
   * Desenha a árvore completa
   */
  drawTree() {
    let treeLayout = d3
      .tree()
      .nodeSize([this.nodeh, this.nodew])
      .separation(function(a, b) {
        return a.parent === b.parent ? 1 : 1.25;
      });
    // console.log("==== New Data ====");
    // console.log(this.data);
    // console.log("==================");
    this.root = d3.hierarchy(this.data);
    treeLayout(this.root);
    this.drawPath();
    this.drawNodes();
    this.drawBalances();
  }

  /**
   * Destroi a árvore, removendo todos os nodes e conexões
   */
  cleanTree() {
    d3.select("svg g.nodes")
      .selectAll("circle")
      .remove();
    d3.select("svg g.links")
      .selectAll("line")
      .remove();
    d3.select("svg g.nodes")
      .selectAll("text")
      .remove();
  }

  /**
   * Seletores usados para construir e mudar elementos da árvore D3.js
   */
  selectArrowSide(d) {
    return d.target.data.value === nodesType.out
      ? "url(#end-arrow)"
      : "url(#start-arrow)";
  }

  selectStrokeColorPath = d => {
    return d.target.data.value === nodesType.out
      ? this.circleColor0
      : this.circleColor1;
  };

  selectX1ByType = d => {
    return d.target.data.value === nodesType.in
      ? this.orientation.x(d.target)
      : this.orientation.x(d.source);
  };

  selectY1ByType = d => {
    return d.target.data.value === nodesType.in
      ? this.orientation.y(d.target)
      : this.orientation.y(d.source);
  };

  selectX2ByType = d => {
    return d.target.data.value === nodesType.in
      ? this.orientation.x(d.source)
      : this.orientation.x(d.target);
  };

  selectY2ByType = d => {
    return d.target.data.value === nodesType.in
      ? this.orientation.y(d.source)
      : this.orientation.y(d.target);
  };

  selectCxNode = d => {
    return this.orientation.x(d);
  };

  selectCyNode = d => {
    return this.orientation.y(d);
  };

  selectColorByType = d => {
    return d.data.value === nodesType.out
      ? this.circleColor0
      : this.circleColor1;
  };

  /**
   * Seleciona a cor do nó de acordo com o atribuito classe
   */
  selectFillColorNodeByClass = d => {
    let color = "white";
    this.optionSelect.class.forEach(function(item) {
      if (item.text === d.data.class) {
        color = item.color;
        return true;
      }
    });
    return color;
  };

  /**
   * Muda o preenchimento do nó quando o usuário passa o mouse sobre
   */
  mouseoverNode = node => {
    this.hoverLastColor = d3.select(node).style("stroke");
    this.hoverLastColorClass = d3.select(node).style("fill");
    d3.select(node)
      .attr("fill", "red")
      .attr("r", this.circleSize)
      .style("stroke", "black")
      .style("stroke-width", "2px")
      .style("stroke-dasharray", "10,4");
  };

  /**
   * Limpa o preenchimento do nó quando o usuário tira o mouse do nó
   */
  mouseoutNode = (node, i, isBalance) => {
    if (this.balanceClicked.id === i) return true;
    if (this.modal) return true;

    let circle = this.circleSize;
    if (isBalance) circle = (circle * 80) / 100;

    d3.select(node)
      .attr("fill", this.hoverLastColorClass)
      .attr("r", circle)
      .style("stroke", this.hoverLastColor)
      .style("stroke-width", "4px")
      .style("stroke-dasharray", "0,0");
  };

  /**
   * Defini o nome do rótulo apresentado em cada nó
   */
  selectLabelOfNode = d => {
    if (d.data.idBalance > this.highestIdBalance)
      this.highestIdBalance = d.data.idBalance;

    if (d.data.idBalance > 0 && !d.data.name) return d.data.idBalance;

    if (d.data.idBalance > 0)
      return d.data.name.substring(0, this.sizeLabel - 1);

    return d.data.name.substring(0, this.sizeLabel);
  };

  /**
   * Centraliza o rótulo no eixo X em função da quantidade de letras
   */
  selectXLabel = d => {
    let shift = 0;
    if (d.data.idBalance > 0)
      shift = d.data.name.substring(0, this.sizeLabel - 1).length * 4;
    else shift = d.data.name.substring(0, this.sizeLabel).length * 4;

    return shift === 0
      ? this.orientation.x(d) - 5
      : this.orientation.x(d) - shift - 1;
  };

  /**
   * Centraliza o rótulo no eixo Y
   */
  selectYLabel = d => {
    return this.orientation.y(d) + 5;
  };

  /**
   * Seleciona o contorno do nó balanço, caso seja do tipo não balanço deixa
   * transparente
   */
  selectStrokeColorBalance = d => {
    if (d.data.idBalance > 0)
      return d.value === 0 ? this.circleColor0 : this.circleColor1;
    else return "transparent";
  };

  /**
   * Desenha todas as linhas e setas da árvore que conectam os nós
   */
  drawPath() {
    this.links = d3
      .select("svg g.links")
      .selectAll("line.link")
      .data(this.root.links())
      .enter()
      .append("line")
      .classed("link", true)
      .style("marker-end", this.selectArrowSide)
      .style("stroke", this.selectStrokeColorPath)
      .attr("x1", this.selectX1ByType)
      .attr("x2", this.selectX2ByType)
      .attr("y1", this.selectY1ByType)
      .attr("y2", this.selectY2ByType);
  }

  /**
   * Desenha todos os nós da árvore
   */
  drawNodes() {
    let that = this;
    let descendants = this.root.descendants();
    this.nodes = d3
      .select("svg g.nodes")
      .selectAll("circle.node")
      .data(descendants)
      .enter()
      .append("circle")
      .attr("cx", this.selectCxNode)
      .attr("cy", this.selectCyNode)
      .attr("r", that.circleSize)
      .style("stroke", this.selectColorByType)
      .attr("fill", this.selectFillColorNodeByClass)
      .style("stroke-width", "4px")
      .on("mouseover", function() {
        const node = this;
        that.mouseoverNode(node);
      })
      .on("mouseout", function(_, i) {
        const node = this;
        that.mouseoutNode(node, i);
      })
      .on("click", that.handleClickFunction);
  }

  /**
   * Desenha todos os nós balanços da árvore
   */
  drawBalances() {
    let that = this;
    let descendants = this.root.descendants();
    this.highestIdBalance = 0;

    const selectNodes = d3
      .select("svg g.nodes")
      .selectAll("circle.node")
      .data(descendants)
      .enter();

    selectNodes
      .append("text")
      .attr("font-size", "14px")
      .attr("font-family", "PT Mono")
      .text(this.selectLabelOfNode)
      .attr("x", this.selectXLabel)
      .attr("y", this.selectYLabel)
      .attr("fill", this.selectColorByType);

    selectNodes
      .append("circle")
      .attr("cx", this.selectCxNode)
      .attr("cy", this.selectCyNode)
      .attr("r", (this.circleSize * 80) / 100)
      .style("stroke", this.selectStrokeColorBalance)
      .attr("fill", "transparent")
      .style("stroke-width", "4px")
      .on("mouseover", function() {
        const node = this;
        that.mouseoverNode(node);
      })
      .on("mouseout", function(_, i) {
        const node = this;
        const isBalance = true;
        that.mouseoutNode(node, i, isBalance);
      })
      .on("click", that.handleClickFunction);

    this.counterBalance = this.highestIdBalance + 1;
  }

  /**
   * Redesenha a árvore após alguma modificação em algum nó
   */
  redrawTree(notSaveState) {
    if (!notSaveState) {
      history.saveState(this.data);
    }
    this.cleanTree();
    this.drawTree();
  }

  /**
   * Adiciona um novo nó filho ao nó selecionado
   */
  addChildrenNode(selected, i, nodeType) {
    if (!this.checkIfHavePermission(selected, nodeType)) {
      return false;
    }

    let newNodeData = {
      children: [],
      value: nodeType,
      idBalance: 0,
      name: "",
      description: "",
      class: DEFAULT.class,
      resource: selected.data.resource,
      unit: selected.data.unit,
      category: selected.data.category,
      duration: DEFAULT.duration,
      factor: DEFAULT.factor
    };

    //Cria um novo nó com base em newNodeData usando d3.hierarchy()
    let newNode = d3.hierarchy(newNodeData);

    // Adiciona propriedades(filho, pai, altura) ao nó
    newNode.depth = selected.depth + 1;
    newNode.height = selected.height - 1;
    newNode.parent = selected;
    newNode.id = Date.now();

    //Caso o nó selecionado não tenha filho criar os vetores para armazenar-los
    if (!selected.children) {
      selected.children = [];
      selected.data.children = [];
    }
    selected.children.push(newNode);
    selected.data.children.push(newNode.data);
    this.redrawTree();
  }

  /**
   * Remove o nó selecionado da árvore
   */
  removeChildrenNode(d) {
    if (d.depth === 0 || d.depth === 1) {
      this.msgAlertUser(error.cannotRemoveDefault);
      return false;
    }

    if (d.data.idBalance > 0) {
      this.msgAlertUser(error.mustRemoveBalanceBefore);
      return false;
    }

    if (this.checkIfIsCantRemoveNode(d)) {
      this.msgAlertUser(error.cannotRemoveLastChild);
      return false;
    }

    if (d.children) {
      this.msgAlertUser(error.cannotRemoveIfHaveChildrens);
      return false;
    }

    this.checkIfNeedRemoveBalance(d);

    const index = d.parent.children.indexOf(d);
    d.parent.children.splice(index, 1);
    d.parent.data.children.splice(index, 1);

    this.redrawTree();
  }

  /**
   * Verifica se tem permissão para remover o nó
   */
  checkIfNeedRemoveBalance(node) {
    let descendants = this.root.descendants();
    let balanceFatherCounter = 0;
    const target = node.parent.data.idBalance;

    if (target <= 0) return false;

    // Conta a quantidade de nós pais do balanço
    descendants.forEach(d => {
      if (d.data.idBalance === target && d.children && d.children.length > 0) {
        balanceFatherCounter += 1;
      }
    });

    // Remove balanço caso tenha apenas 1 nó pai e seu ulitmo filho seja removido
    if (balanceFatherCounter < 2 && node.parent.children.length <= 1) {
      descendants.forEach(d => {
        if (d.data.idBalance === target) d.data.idBalance = 0;
      });
    }
  }

  /**
   * Reseta a variavel responsavel por controlar qual foi o primeiro clique no
   * momento da criação do balanço
   */
  resetNodeSelected(notSaveState) {
    this.balanceClicked.id = null;
    this.balanceClicked.d = null;
    if (notSaveState) this.redrawTree(true);
    else this.redrawTree();
  }

  /**
   * Reseta a variável responsavel por controlar qual foi o primeiro clique no
   * momento da criação do balanço e redesenha a árvore após o segundo clique
   */
  joinBalance(balance1, balance2) {
    let descendants = this.root.descendants();
    let newId = 0;
    let target = 0;

    if (balance1.data.idBalance > balance2.data.idBalance) {
      target = balance1.data.idBalance;
      newId = balance2.data.idBalance;
    } else {
      target = balance2.data.idBalance;
      newId = balance1.data.idBalance;
    }

    descendants.forEach(d => {
      if (d.data.idBalance === target) d.data.idBalance = newId;

      //Corrigi os id após remover um balanço
      if (d.data.idBalance > target) d.data.idBalance -= 1;

      // Copia os dados do segundo clique para todos nós do balanço
      if (d.data.idBalance === newId) this.copyBalanceData(d, balance1);
    });

    this.counterBalance -= 1;
  }

  /**
   * Copia os atribuitos do segundo nó clicado para o primeiro nó no momento
   * da criação do balanço
   */
  copyBalanceData(nodeClicked1, nodeClicked2) {
    nodeClicked1.data.name = nodeClicked2.data.name;
    nodeClicked1.data.description = nodeClicked2.data.description;
    nodeClicked1.data.class = nodeClicked2.data.class;
    nodeClicked1.data.duration = nodeClicked2.data.duration;
  }

  /**
   * Adiciona ao nó o tipo balanço, caso as regras de negócio sejam satisfeitas
   */
  changeNodeTypeToBalance(d, id) {
    const descendants = this.root.descendants();
    let balanceFatherCounter = 0;
    this.counterBalanceClick += 1;

    if (this.counterBalanceClick === 2) {
      this.counterBalanceClick = 0;

      if (d === this.balanceClicked.d) {
        this.resetNodeSelected(true);
        return false;
      }

      if (
        d.depth === 0 ||
        d.depth === 1 ||
        this.balanceClicked.d.depth === 0 ||
        this.balanceClicked.d.depth === 1
      ) {
        this.msgAlertUser(error.cannotAddBalanceInDefaultNodes);
        this.resetNodeSelected(true);
        return false;
      }

      if (d.data.resource !== this.balanceClicked.d.data.resource) {
        this.msgAlertUser(error.cannotHaveBalanceWithDifferentRessources);
        this.resetNodeSelected(true);
        return false;
      }

      if (
        d.data.idBalance > 0 &&
        d.data.idBalance === this.balanceClicked.d.data.idBalance
      ) {
        this.msgAlertUser(error.cannotCreateBalanceIfIsAlready);
        this.resetNodeSelected(true);
        return false;
      }

      if (
        d.data.idBalance > 0 &&
        this.balanceClicked.d.data.idBalance > 0 &&
        d.data.value !== this.balanceClicked.d.data.value
      ) {
        // União de balanço
        this.joinBalance(d, this.balanceClicked.d);
        this.resetNodeSelected();
        return true;
      }

      if (this.balanceClicked.d.data.idBalance > 0) {
        this.msgAlertUser(error.firstClickCannotBeBalance);
        this.resetNodeSelected(true);
        return false;
      }

      if (!this.balanceClicked.d.children) {
        if (!d.children) {
          this.msgAlertUser(error.mustHaveChildren);
          //console.log("d value: " + d.data.value);
          //console.log("d lastvalue: " + this.balanceClicked.d.data.value);
          this.resetNodeSelected(true);
          return false;
        }

        if (d.children && d.data.value !== this.balanceClicked.d.data.value) {
          this.msgAlertUser(error.mustStartwithChildren);
          this.resetNodeSelected(true);
          return false;
        }
      } else {
        if (!d.children) {
          this.msgAlertUser(error.mixedMustBeDifferent);
          this.resetNodeSelected(true);
          return false;
        }

        if (d.data.value === this.balanceClicked.d.data.value) {
          this.msgAlertUser(error.mixedMustBeDifferent);
          this.resetNodeSelected(true);
          return false;
        }

        const target = d.data.idBalance;
        // Conta a quantidade de nós pais do balanço
        descendants.forEach(d => {
          if (
            d.data.idBalance === target &&
            d.children &&
            d.children.length > 0
          ) {
            balanceFatherCounter += 1;
          }
        });

        if (
          d.data.value !== this.balanceClicked.d.data.value &&
          d.data.idBalance > 0 &&
          balanceFatherCounter >= 2
        ) {
          this.msgAlertUser(error.mixedMustBeDifferent);
          this.resetNodeSelected(true);
          return false;
        }
      }

      if (
        d.data.value !== this.balanceClicked.d.data.value &&
        (d.children.length >= 2 || this.balanceClicked.d.children.length >= 2)
      ) {
        this.msgAlertUser(
          error.cannotCreateMixBalanceWithFatherWithMore2Childrens
        );
        this.resetNodeSelected(true);
        return false;
      }

      if (d.data.idBalance > 0) {
        this.balanceClicked.d.data.idBalance = d.data.idBalance;
      } else {
        d.data.idBalance = this.counterBalance;
        this.balanceClicked.d.data.idBalance = this.counterBalance;
        this.counterBalance += 1;
      }

      this.copyBalanceData(this.balanceClicked.d, d);
      this.resetNodeSelected();
    } else {
      this.balanceClicked.id = id;
      this.balanceClicked.d = d;
    }
  }

  /**
   * Remove o nó o tipo balanço, caso as regras de negócio sejam satisfeitas
   */
  removeNodeTypeToBalance(d) {
    if (d.data.idBalance <= 0) {
      this.msgAlertUser(error.isNotBalance);
      return false;
    }

    const target = d.data.idBalance;
    let descendants = this.root.descendants();
    let count = 0;

    descendants.forEach(function(d) {
      if (d.data.idBalance === target) count++;
    });

    if (count > 2 && d.children) {
      this.msgAlertUser(error.cannotRemoveFatherBalanceBigger2);
      return false;
    }

    if (count > 2 && !d.children) {
      d.data.idBalance = 0;
    } else {
      descendants.forEach(function(d) {
        if (d.data.idBalance === target) d.data.idBalance = 0;

        //Corrigi os id após remover um balanço
        if (d.data.idBalance > target) d.data.idBalance -= 1;
      });

      this.counterBalance -= 1;
    }

    this.redrawTree();
  }

  /**
   * Verifica se tem permissão para adicionar um novo nó
   */
  checkIfHavePermission(fatherNode, newNodeType) {
    const descendants = this.root.descendants();
    var fatherType = fatherNode.data.value;

    // Não é possível incluir novas Arestas ao Vértice raiz
    if (fatherNode.depth === 0) {
      this.msgAlertUser(error.cannotInclude);
      return false;
    }

    if (!fatherNode.children && fatherType !== newNodeType) {
      this.msgAlertUser(error.mustIsEqualFather);
      return false;
    }

    //Não é possível incluir novas Arestas ao Vértice balanço sem filhos
    if (fatherNode.data.idBalance > 0 && !fatherNode.children) {
      this.msgAlertUser(error.cannotAddNodeInBalanceChildren);
      return false;
    }

    //Não pode incluir novas arestas em nó pai de balanço misto
    if (fatherNode.data.idBalance > 0 && fatherNode.children) {
      let counterIn = 0;
      let counterOut = 0;
      descendants.forEach(d => {
        if (d.data.idBalance === fatherNode.data.idBalance) {
          if (d.data.value === nodesType.in) {
            counterIn += 1;
          } else {
            counterOut += 1;
          }
        }
      });

      // Verifica se é balanço misto
      if (counterIn >= 1 && counterOut >= 1) {
        this.msgAlertUser(error.cannotAddNodeInMixedBalanceFather);
        return false;
      }
    }

    return true;
  }

  /**
   * Verifica se tem permissão para remover o nó
   */
  checkIfIsCantRemoveNode(node) {
    const qtdBrother = node.parent.children.length;
    const typeFather = node.parent.data.value;
    const typeNode = node.data.value;
    const nodeTypeFather = node.parent.children.filter(
      n => n.data.value === typeFather
    );

    if (typeNode !== typeFather) {
      return false;
    }

    if (nodeTypeFather.length === 1 && qtdBrother > 1) {
      return true;
    }

    return false;
  }

  /**
   * Salva o json com dados da árvore no localstorage
   */
  save() {
    this.resetNodeSelected(true);
    localStorage.data = JSON.stringify(this.data);
  }

  /**
   * Carrega o json com dados da árvore do localstorage
   */
  load() {
    if (localStorage.data) {
      this.data = JSON.parse(localStorage.data);
    }
  }

  /**
   * Remove os dados da árvore do localstorage e redesenha a árvore
   */
  clean() {
    console.log("clean");
    //if (localStorage.data) {
    console.log("remove localstorage");
    localStorage.removeItem("data");
    //}
    history.clean();
    this.counterBalance = 1;
    this.inicializeData(true);
    this.redrawTree(true);
  }

  /**
   * Desfaz uma modificação realizada na árvore
   */
  undo() {
    if (history.canUndo()) history.undo();
    this.data = history.getState();
    this.redrawTree(true);
  }

  /**
   * Refaz uma modificação desfeita na árvore
   */
  redo() {
    if (history.canRedo()) history.redo();
    this.data = history.getState();
    this.redrawTree(true);
  }

  /**
   * Mensagem de alerta apresentada de acordo com as regras de negócio
   */
  msgAlertUser(msg) {
    this.error({
      type: "warning",
      title: "Oops...",
      text: msg
    });
  }

  /**
   * Converte o tipo do nó de Int para String, usado na escrita do json
   */
  convertTypeToString(value) {
    switch (value) {
      case nodesType.in:
        return nodesTypeName.in;
      case nodesType.out:
        return nodesTypeName.out;
    }
  }

  /**
   * Converte o tipo do nó de String para Int, usado na leitura do json
   */
  convertTypeToInt(value) {
    switch (value) {
      case nodesTypeName.in:
        return nodesType.in;
      case nodesTypeName.out:
        return nodesType.out;
    }
  }
  /**
   * Gera uma chave para nó simples com o formato da plataforma P+P
   */
  addKeyNode(d, numVertices, nodes) {
    let chave = `n_${numVertices}_${d.data.name}_${d.data.description}`;
    let newNode = {
      formula: d.data.duration,
      stages: [d.data.class],
      flows: [],
      type: this.convertTypeToString(d.data.value)
    };
    // chave com new node em graph.nodes
    nodes[chave] = newNode;
    // Salva chave para adiconar no idFlow ao nós que formam o fluxo
    d.chave = chave;
  }

  /**
   * Gera uma chave para nó balanço com o formato da plataforma P+P
   */
  addKeyBalance(d, numVertices, nodes) {
    if (!d.children) {
      // let chave = `s_${d.data.value}_${d.data.idBalance}_${d.data.name}_${d.data.description}`;
      let chave = `s_${numVertices}_${d.data.idBalance}_${d.data.name}_${d.data.description}`;
      let newNode = {
        formula: d.data.duration,
        stages: [d.data.class],
        flows: [],
        type: this.convertTypeToString(d.data.value)
      };

      // chave com new node em graph.nodes
      nodes[chave] = newNode;
      // Salva chave para adiconar no idFlow ao nós que formam o fluxo
      d.chave = chave;
    } else {
      let chave = `b_${numVertices}_${d.data.idBalance}_${d.data.name}_${d.data.description}`;
      let newNode = {
        formula: d.data.duration,
        stages: [d.data.class],
        flows: [],
        type: this.convertTypeToString(d.data.value)
      };

      // chave com new node em graph.nodes
      nodes[chave] = newNode;
      // Salva chave para adiconar no idFlow ao nós que formam o fluxo
      d.chave = chave;
    }
  }

  /**
   * Gera uma fluxo de conexão entre dois nós com o formato da plataforma P+P
   */
  addNewFlow(d, graph) {
    let idParent = d.source.chave;
    let idChild = d.target.chave;
    let idFlow = "";

    if (d.target.value === nodesType.out) idFlow = `${idParent}-${idChild}`;
    else idFlow = `${idChild}-${idParent}`;

    let newFlow = {
      formula: d.target.data.factor,
      resource: {
        name: d.target.data.resource,
        unit: d.target.data.unit,
        category: d.target.data.category
      }
    };

    graph.flows[idFlow] = newFlow;
    graph.nodes[d.source.chave].flows.push(idFlow);
    graph.nodes[d.target.chave].flows.push(idFlow);
  }

  /**
   * Converte o JSON do formato D3.js para o formato da P+P
   */
  generateJsonPP() {
    //Copia dados da árvore usando o hierarchy do d3.js
    let tempData = d3.hierarchy(this.data);
    let descendants = tempData.descendants();
    let links = tempData.links();
    let numVertices = 0;

    let simulationData = {
      graph: {
        nodes: {},
        flows: {}
      }
    };

    descendants.forEach(d => {
      numVertices = numVertices + 1;
      if (!d.data.idBalance || d.data.idBalance === 0) {
        // É um nó comum
        this.addKeyNode(d, numVertices, simulationData.graph.nodes);
      } else {
        // É um nó balanço
        this.addKeyBalance(d, numVertices, simulationData.graph.nodes);
      }
    });

    links.forEach(d => {
      this.addNewFlow(d, simulationData.graph);
    });

    simulationData.graph.root = descendants[0].chave;
    simulationData.graph.nodeOne = descendants[1].chave;

    this.json.simulationData.graph = simulationData.graph;

    // console.log("====JSON INICIO====");
    // console.log(JSON.stringify(this.json));
    // console.log("====JSON FIM=======");
    // console.log("Link para deixar o json indentado:");
    // console.log("https://jsonformatter.org/");

    this.copyToClipboard(JSON.stringify(this.json));

    return JSON.stringify(this.json);
  }

  copyToClipboard(str) {
    const el = document.createElement("textarea");
    el.value = str;
    el.setAttribute("readonly", "");
    el.style.position = "absolute";
    el.style.left = "-9999px";
    document.body.appendChild(el);
    el.select();
    document.execCommand("copy");
    document.body.removeChild(el);
  }

  isBalanceKey(key) {
    if (key[0] === "b" || key[0] === "s") {
      return true;
    }
    return false;
  }

  readFlow(simulationData, key, newFlow) {
    let value = simulationData.graph.flows[key];
    const nodes = key.split("-");
    const node1 = nodes[0].split("_");
    const node2 = nodes[1].split("_");
    const linkType = simulationData.graph.nodes[nodes[1]].type;
    const factor = value.formula;
    let stages = null;
    let duration = null;
    let newType = null;
    let nodeParent = null;
    let nodeParentData = null;
    let name = null;
    let description = null;
    let id = null;
    let idBalance = 0;

    // console.log(value);
    // console.log(nodes);

    if (linkType === nodesTypeName.in) {
      newType = nodesType.in;
      nodeParent = node2.join("_");
      id = node1.join("_");

      if (this.isBalanceKey(id)) {
        idBalance = parseInt(node1[2]);
        name = node1[3];
        description = node1[4];
      } else {
        name = node1[2];
        description = node1[3];
      }

      // console.log(nodes[0]);
      // console.log(simulationData.graph.nodes);
      // console.log(simulationData.graph.nodes[nodes[0]]);

      stages = simulationData.graph.nodes[nodes[0]].stages[0];
      duration = simulationData.graph.nodes[nodes[0]].formula;
      nodeParentData = {
        idBalance: this.isBalanceKey(nodes[1]) ? node2[2] : 0,
        name: this.isBalanceKey(nodes[1]) ? node2[3] : node2[2],
        description: this.isBalanceKey(nodes[1]) ? node2[4] : node2[3],
        newType: nodesType.out,
        stages: simulationData.graph.nodes[nodes[1]].stages[0],
        duration: simulationData.graph.nodes[nodes[1]].formula
      };
    } else {
      newType = nodesType.out;
      nodeParent = node1.join("_");
      id = node2.join("_");

      if (this.isBalanceKey(id)) {
        idBalance = parseInt(node2[2]);
        name = node2[3];
        description = node2[4];
      } else {
        name = node2[2];
        description = node2[3];
      }
      stages = simulationData.graph.nodes[nodes[1]].stages[0];
      duration = simulationData.graph.nodes[nodes[1]].formula;
      nodeParentData = {
        idBalance: this.isBalanceKey(nodes[0]) ? node1[2] : 0,
        name: this.isBalanceKey(nodes[0]) ? node1[3] : node1[2],
        description: this.isBalanceKey(nodes[0]) ? node1[4] : node1[3],
        newType: nodesType.in,
        stages: simulationData.graph.nodes[nodes[0]].stages[0],
        duration: simulationData.graph.nodes[nodes[0]].formula
      };
    }

    const newNode = {
      id: id,
      idBalance: idBalance,
      parent: nodeParent,
      parentData: nodeParentData,
      name: name,
      description: description,
      value: newType,
      class: stages,
      duration: duration,
      factor: factor,
      resource: value.resource.name,
      unit: value.resource.unit,
      category: value.resource.category
    };

    newFlow.push(newNode);
  }

  /**
   * Converte o JSON da P+P para formato do D3.js
   */
  readJsonPP(json) {
    //let simulationData = JSON.parse(json).simulationData;
    let simulationData = json.simulationData;
    let newFlow = [];

    const nodeRoot = simulationData.graph.nodes[simulationData.graph.root];
    const dataRoot = simulationData.graph.root.split("_");

    // Para cada fluxo no json
    Object.keys(simulationData.graph.flows).forEach(key => {
      // Le os dados separado e agrupa em cada objeto
      this.readFlow(simulationData, key, newFlow);
    });

    // Adiciona o nó raiz no inicio do vetor
    newFlow.unshift({
      id: dataRoot.join("_"),
      idBalance: 0,
      parent: "",
      name: dataRoot[2],
      description: dataRoot[3],
      value: 1,
      class: nodeRoot.stages[0],
      resource: DEFAULT.resource,
      unit: DEFAULT.unit,
      category: DEFAULT.category,
      duration: nodeRoot.formula,
      factor: DEFAULT.factor
    });

    let invertFlow = [];
    let invertParent = [];

    newFlow.forEach(function(node) {
      let notHaveParent = false;
      for (let i = 0; i < newFlow.length; i++) {
        if (node.parent === newFlow[i].id || node.parent === "") {
          notHaveParent = true;
        }
      }

      if (!notHaveParent) {
        const resp = invertParent.find(function(fatherId) {
          if (fatherId === node.parent) {
            return true;
          } else {
            return false;
          }
        });

        if (
          node.value === 0 &&
          node.parentData.newType === 1 &&
          resp == undefined
        ) {
          invertParent.push(node.parent);

          invertFlow.push({
            ...node,
            id: node.parent,
            idBalance: node.parentData.idBalance,
            parent: node.id,
            parentData: node.parentData,
            name: node.parentData.name,
            description: node.parentData.description,
            value: node.parentData.newType,
            unit: node.unit,
            // category: value.resource.category,
            class: node.parentData.stages,
            duration: node.parentData.duration
            // factor: factor
          });
        } else {
          invertFlow.push(node);
        }
      } else {
        invertFlow.push(node);
      }
    });

    // console.log("########################### -> Flow Antes");
    // console.log(newFlow);
    // console.log("########################### -> InvertFlow Antes");
    // console.log(invertFlow);

    let hierarchyFlow = this.getNestedChildren(invertFlow, "");
    // console.log(hierarchyFlow[0]);

    this.data = hierarchyFlow[0];
    this.redrawTree(true);
  }

  /**
   * Converte um flat json em um nested json (formato usado pelo d3.js)
   */
  getNestedChildren(arr, parent) {
    var out = [];
    for (var i in arr) {
      if (arr[i].parent == parent) {
        var children = this.getNestedChildren(arr, arr[i].id);

        if (children.length) {
          arr[i].children = children;
        }

        //delete arr[i].parent;
        //delete arr[i].id;

        out.push(arr[i]);
      }
    }
    return out;
  }
}

export default D3Tree;
