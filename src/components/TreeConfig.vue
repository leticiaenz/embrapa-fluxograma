<template>
  <v-dialog content-class="rightModal" v-model="config" persistent max-width="400px">
    <v-card>
      <v-card-title>
        <span class="headline">Configurações</span>
      </v-card-title>
      <v-card-text class="ma-0">
        <v-switch class="ma-0 pa-0" v-model="mini" :label="`Mini Menu`"></v-switch>

        <v-select
          class="ma-0 pa-0"
          :items="optionSelect.orientationTree"
          label="Orientação da Arvoré"
          v-model="selectedOrientaionTree"
        ></v-select>

        <v-subheader class="ma-0 pa-0">Largura Arvoré</v-subheader>
        <v-slider
          class="ma-0 pa-0"
          max="100"
          min="52"
          v-model="nodeh"
          thumb-color="blue"
          thumb-label
        ></v-slider>

        <v-subheader class="ma-0 pa-0">Altura Arvoré</v-subheader>
        <v-slider
          class="ma-0 pa-0"
          max="140"
          min="65"
          v-model="nodew"
          thumb-color="blue"
          thumb-label
        ></v-slider>
      </v-card-text>
      <v-card-actions>
        <v-btn @click="resetConfig">Resetar</v-btn>
        <v-btn @click="saveConfig">Salvar</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
import D3TreeClass, { actionsType, nodesType } from "../library/D3Tree";

export default {
  props: ["config"],
  data() {
    return {
      mini: false,
      selectedOrientaionTree: "top",
      nodew: 80,
      nodeh: 60,
      optionSelect: {
        orientationTree: [
          { text: "Cima para Baixo", value: "top" },
          { text: "Baixo para Cima", value: "bottom" },
          { text: "Direita para Esquerda", value: "right" },
          { text: "Esquerda para Direita", value: "left" }
        ]
      }
    };
  },
  watch: {
    /**
     * Observa as modificações do modal e carrega os dados do nó selecionando
     * quando o modal é aberto para edição e desabilita alguns campos caso
     * seja um nó do tipo balanço
     **/
    mini(newValue) {
      this.$emit("executeModelCommand", actionsType.mini);
    },
    selectedOrientaionTree(newValue) {
      this.$emit("executeModelCommand", actionsType.orientation, newValue);
    },
    nodew(newValue) {
      this.$emit("executeModelCommand", actionsType.nodew, newValue);
    },
    nodeh(newValue) {
      this.$emit("executeModelCommand", actionsType.nodeh, newValue);
    }
  },
  methods: {
    /**
     *
     **/
    resetConfig() {
      this.mini = false;
      this.selectedOrientaionTree = "top";
      this.nodew = 80;
      this.nodeh = 60;
      this.$emit("executeModelCommand", actionsType.config);
    },

    /**
     *
     **/
    saveConfig() {
      this.$emit("executeModelCommand", actionsType.config);
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