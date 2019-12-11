<template>
  <v-dialog content-class="rightModal" v-model="modal" persistent max-width="400px">
    <v-card>
      <v-card-text>
        <v-container>
          <v-text-field label="Nome" v-model="edit.name" :disabled="edit.disableEdit" />
          <v-text-field
            label="Descrição"
            v-model="edit.description"
            required
            :disabled="edit.disableEdit"
          />
          <v-select
            :items="optionSelect.class"
            label="Classe"
            v-model="edit.class"
            required
            :disabled="edit.disableEdit"
          />
          <v-select
            :items="optionSelect.resource"
            label="Recurso"
            v-model="edit.resource"
            required
            :disabled="edit.disableEdit"
          />
          <v-select
            :items="optionSelect.duration"
            label="Duração"
            v-model="edit.duration"
            required
            :disabled="edit.disableEdit"
          />
          <v-select :items="optionSelect.factor" label="Fator" v-model="edit.factor" required />
        </v-container>
      </v-card-text>
      <v-card-actions>
        <v-btn @click="cancelChangeInNode">Cancelar</v-btn>
        <v-btn @click="saveChangeInNode">Salvar</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
export default {
  props: ["modal", "optionSelect", "selectedNode"],
  data() {
    return {
      edit: {
        node: "",
        name: "",
        description: "",
        class: "",
        resource: "",
        disableEdit: false,
        duration: "",
        factor: ""
      }
    };
  },
  watch: {
    /**
     * Observa as modificações do modal e carrega os dados do nó selecionando
     * quando o modal é aberto para edição e desabilita alguns campos caso
     * seja um nó do tipo balanço
     **/
    modal(newValue) {
      if (newValue === true) {
        this.fillChangesInputsFromNode();
        if (this.selectedNode.data.idBalance > 0) this.edit.disableEdit = true;
      } else this.edit.disableEdit = false;
    }
  },
  methods: {
    /**
     * Atualiza os input com os valores do nó selecionado para edição
     **/
    fillChangesInputsFromNode() {
      this.edit.name = this.selectedNode.data.name;
      this.edit.description = this.selectedNode.data.description;
      this.edit.class = this.selectedNode.data.class;
      this.edit.resource = this.selectedNode.data.resource;
      this.edit.duration = this.selectedNode.data.duration;
      this.edit.factor = this.selectedNode.data.factor;
    },

    /**
     * Emiti um evento para o component Tree responsável por fechar o modal
     * e redesenhar a árvore em caso de cancelamento da operação
     **/
    cancelChangeInNode() {
      this.cleanChangeInputs();
      this.$emit("confirmEditNode", true);
    },

    /**
     * Limpa os dados digitados nos inputs e selects
     **/
    cleanChangeInputs() {
      this.edit.name = "";
      this.edit.description = "";
      this.edit.class = "";
      this.edit.resource = "";
      this.edit.duration = "";
      this.edit.factor = "";
      this.edit.disableEdit = false;
    },

    /**
     * Atualiza o nó com os valores dos inputs e emiti um evento para o
     * component Tree responsável por fechar o modal e redesenhar a árvore
     * salvando a modificação no histórico para poder ser desfeita
     **/
    saveChangeInNode() {
      this.saveChangesInput();
      this.cleanChangeInputs();
      this.$emit("confirmEditNode", false);
    },

    /**
     * Atualiza os valores do nó com os novos valores do input
     **/
    saveChangesInput() {
      this.selectedNode.data.name = this.edit.name;
      this.selectedNode.data.description = this.edit.description;
      this.selectedNode.data.class = this.edit.class;
      this.selectedNode.data.resource = this.edit.resource;
      this.selectedNode.data.duration = this.edit.duration;
      this.selectedNode.data.factor = this.edit.factor;

      // Busca o objeto recurso escolhido para pegar as propriedades
      // unit e category com base na escolha do usuário
      const resourceName = this.edit.resource;
      const resourceData = this.optionSelect.resource.find(function(item) {
        if (item.text === resourceName) return item;
      });

      this.selectedNode.data.unit = resourceData.unit;
      this.selectedNode.data.category = resourceData.category;
    }
  }
};
</script>

<style>
@media (min-width: 600px) {
  .rightModal {
    position: absolute;
    top: 0;
    right: 0;
  }
}
</style>