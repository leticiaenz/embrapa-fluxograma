<template>
  <v-app id="inspire">
    <TreeMenu
      :TypeOfActionSelectedNow="TypeOfActionSelectedNow"
      :mini="mini"
      @setTypeClickTree="setTypeClickTree"
      @executeModelCommand="executeModelCommand"
    />

    <TreeModal
      :modal="modal"
      :optionSelect="optionSelect"
      :selectedNode="selectedNode"
      @confirmEditNode="confirmEditNode"
    />

    <TreeConfig :config="config" @executeModelCommand="executeModelCommand" />

    <v-content>
      <div class="fluxograma" ref="fluxograma"></div>
    </v-content>
  </v-app>
</template>

<script>
//import jsonExampleLoadFluxograma from "../jsons/jsonFluxograma.json";
//import jsonExampleIgnoreSimulationData from "../jsons/jsonPlataforma.json";
import jsonFernando from "../jsons/jsonFernando.json";
import TreeMenu from "../components/TreeMenu";
import TreeModal from "../components/TreeModal";
import TreeConfig from "../components/TreeConfig";
import D3TreeClass, { actionsType, nodesType } from "../library/D3Tree";
const tree = new D3TreeClass();

export default {
  components: { TreeMenu, TreeModal, TreeConfig },
  data() {
    return {
      optionSelect: {
        class: [],
        resource: [],
        duration: [],
        factor: []
      },
      selectedNode: null,
      modal: false,
      config: false,
      mini: false,
      TypeOfActionSelectedNow: actionsType.edit
    };
  },
  mounted: function() {
    // Carrega os dados dos atributos(class,resource,duration,factor) do backend
    this.loadAtributesBackend();
    // Configura qual função será acionada para mostrar os erros na tela
    tree.setHandleError(this.$swal);
    // Configura qual função será acionada ao clicar em um nó da árvore
    tree.setHandleClickFunction(this.handleOnclickFunction);
    // Ajusta a árvore para utilizar os atributos do select fornecido pelo backend
    // E configura qual cor vai representar cada classe
    tree.setAttributesSelectAndColor(this.optionSelect);
    // Constroi a árvore na div fluxograma
    tree.build();
  },
  methods: {
    /**
     * Executa o tipo de clique escolhido no menu no nó selecionado
     * @param selected representa os dados do nó selecionado
     * @param index representa a identicação do nó selecionado
     */
    handleOnclickFunction(selected, index) {
      switch (this.TypeOfActionSelectedNow) {
        case actionsType.addIn:
          tree.addChildrenNode(selected, index, nodesType.in);
          break;
        case actionsType.addOut:
          tree.addChildrenNode(selected, index, nodesType.out);
          break;
        case actionsType.remove:
          tree.removeChildrenNode(selected, index);
          break;
        case actionsType.addBalance:
          tree.changeNodeTypeToBalance(selected, index);
          break;
        case actionsType.removeBalance:
          tree.removeNodeTypeToBalance(selected, index);
          break;
        case actionsType.edit:
          this.selectedNode = selected;
          this.modal = true;
          // Não limpa o nó selecionado caso o modal esteja aberto
          tree.setModalstate(true);
          break;
        default:
          tree.addChildrenNode(selected, index, nodesType.in);
      }
    },

    /**
     * Evento acionado pelo componente treeMenu
     * Seleciona o tipo de clique que será executado ao clicar no nó e remove
     * qualquer nó selecionado anteriormente
     * @param type identifica o tipo de clique selecionado
     */
    setTypeClickTree(type) {
      this.TypeOfActionSelectedNow = type;
      tree.resetNodeSelected(true);
    },

    /**
     * Evento acionado pelo componente treeMenu
     * Executa um comando de modificação na árvore (redo, undo, save, reset)
     * @param command identifica o tipo de commando executado
     */
    executeModelCommand(command, param) {
      console.log(`comando=${command} -> ${param}`);
      switch (command) {
        case actionsType.undo:
          tree.undo();
          break;
        case actionsType.redo:
          tree.redo();
          break;
        case actionsType.save:
          this.saveTreeBackend();
          break;
        case actionsType.reset:
          this.removeTreeBackend();
          break;
        case actionsType.config:
          this.config = !this.config;
          break;
        case actionsType.mini:
          this.mini = !this.mini;
          break;
        case actionsType.orientation:
          tree.changeOrientationTree(param);
          break;
        case actionsType.nodeh:
          tree.changeNodeh(param);
          break;
        case actionsType.nodew:
          tree.changeNodew(param);
          break;
      }
    },

    /**
     * Evento acionado pelo componente treeModal
     * Redesenha a árvore e fecha o modal após a edição do nó
     * @param isNotModified não salva o histórico de modificação caso seja true
     */
    confirmEditNode(isNotModified) {
      tree.redrawTree(isNotModified);
      this.modal = false;
      tree.setModalstate(false);
    },

    /**
     * Busca no backend as opções de atribuitos disponíveis para os selects do
     * modal e repassa essas informações para o component TreeModal via props
     */
    loadAtributesBackend() {
      /*************************************************************************
       * //TODO: Adicionar aqui no futuro código para carregar json do backend
       ************************************************************************/
      //const json = jsonExampleIgnoreSimulationData;
      //const json = jsonExampleLoadFluxograma;
      const json = jsonFernando;
      /************************************************************************/

      /**
       * Fornece para lib que constroi o fluxograma o json para alterar apenas simulationData
       *
       * 1 - Caso o JSON tenha o formato antigo da plataforma o simulationData é ignorado
       * mas as opções de atributos são carregados do json e o fluxograma iniciara com
       * o json carregado do localstorage, caso o localstorage esteja vazio será iniciado
       * uma simulação padrão com os dois nós iniciais
       * Exemplo de json -> jsonExampleIgnoreSimulationData
       *
       * 2 - Caso o JSON tenha o formato novo definido pela Fernando no documento de requisito
       * conforme o algoritmo no topico de "Detalhamento do Processo do Menu Salvar" pg. 28
       * na qual as chaves dos nós devem começam com os caracteres "d_" ou "s_" ou "b_".
       * O fluxograma ira carregar os dados do simulationData e gerar fluxograma salvo.
       * Exemplo de json -> jsonExampleLoadFluxograma
       */
      tree.setJsonFromPP(json);

      // Carrega os dados do json para gerar os selecteds com as opções fornecidas
      this.loadVectorFromJson(
        json.simulationData.formulas.flows,
        this.optionSelect.factor
      );
      this.loadVectorFromJson(
        json.simulationData.formulas.nodes,
        this.optionSelect.duration
      );
      this.loadClassFromJson(
        json.simulationData.stagesHierarchy,
        this.optionSelect.class
      );
      this.loadResourceFromJson(
        json.simulationData.resources,
        this.optionSelect.resource
      );
    },

    /**
     * Carrega as opções de fatores e duração do json recebido pela plataforma
     */
    loadVectorFromJson(from, to) {
      from.forEach(element => {
        to.push({
          text: element
        });
      });
      to.sort((a, b) => (a.text > b.text ? 1 : -1));
    },

    /**
     * Carrega as opções de classes do json recebido pela plataforma
     */
    loadClassFromJson(from, to) {
      for (let item in from) {
        to.push({
          color: from[item].color,
          text: item
        });
      }
      to.sort((a, b) => (a.text > b.text ? 1 : -1));
    },

    /**
     * Carrega as opções de recursos do json recebido pela plataforma
     */
    loadResourceFromJson(from, to) {
      for (let item in from) {
        to.push({
          unit: from[item].unit,
          category: from[item].category,
          text: item
        });
      }
      to.sort((a, b) => (a.text > b.text ? 1 : -1));
    },

    /**
     * Salva no backend da aplicação o estado atual árvore construida
     */
    saveTreeBackend() {
      /*************************************************************************
       * //TODO: Adicionar aqui no futuro código para salvar árvore no backend
       ************************************************************************/

      // Por enquanto esta apenas salvando no localstorage
      tree.save();

      // Pega o json convertido no formato P+P para enviar para a plataforma
      const jsonPP = tree.generateJsonPP();
    },

    /**
     * Destroy no backend da aplicação o estado atual árvore construida
     */
    removeTreeBackend() {
      /*************************************************************************
       * //TODO: Adicionar aqui no futuro código para exluir árvore no backend
       ************************************************************************/

      // Por enquanto esta apenas removendo do localstorage
      tree.clean();
    }
  }
};
</script>

<style>
.fluxograma {
  /* border: solid; */
  padding: 0;
  margin: 0;
  font-family: "PT Mono", monospace;
}

.link {
  fill: none;
  stroke: #ccc;
  stroke-width: 3px;
}
</style>