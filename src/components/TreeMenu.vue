<template>
  <v-card>
    <v-navigation-drawer fixed clipped v-model="drawer" :mini-variant="mini" app>
      <v-list dense>
        <v-subheader class="mt-2 grey--text text--darken-1">Fluxos</v-subheader>

        <v-list-tile
          v-for="item in menuFlow"
          :key="item.value"
          @click="setTypeOfClick(item.value)"
          :class="isActive(item.value)"
          :ripple="true"
        >
          <v-list-tile-action>
            <v-icon>{{ item.icon }}</v-icon>
          </v-list-tile-action>
          <v-list-tile-content>
            <v-list-tile-title>{{ item.text }}</v-list-tile-title>
          </v-list-tile-content>
        </v-list-tile>

        <v-subheader class="mt-2 grey--text text--darken-1">Balanços</v-subheader>

        <v-list-tile
          v-for="item in menuBalance"
          :key="item.value"
          @click="setTypeOfClick(item.value)"
          :class="isActive(item.value)"
          :ripple="true"
        >
          <v-list-tile-action>
            <v-icon>{{ item.icon }}</v-icon>
          </v-list-tile-action>
          <v-list-tile-content>
            <v-list-tile-title>{{ item.text }}</v-list-tile-title>
          </v-list-tile-content>
        </v-list-tile>

        <v-subheader class="mt-2 grey--text text--darken-1">Modelo</v-subheader>

        <v-list-tile
          v-for="item in menuModel"
          :key="item.value"
          @click="executeModelCommand(item.value)"
          :ripple="true"
        >
          <v-list-tile-action>
            <v-icon>{{ item.icon }}</v-icon>
          </v-list-tile-action>
          <v-list-tile-content>
            <v-list-tile-title>{{ item.text }}</v-list-tile-title>
          </v-list-tile-content>
        </v-list-tile>
      </v-list>
    </v-navigation-drawer>

    <v-toolbar color="#003399" dense dark fixed clipped-left app>
      <v-toolbar-side-icon @click.stop="drawer = !drawer"></v-toolbar-side-icon>
      <v-toolbar-title class="mr-5 align-center">
        <span class="title">Embrapa</span>
      </v-toolbar-title>
      <v-spacer></v-spacer>
    </v-toolbar>
  </v-card>
</template>

<script>
import { actionsType } from "../library/D3Tree";
export default {
  props: ["TypeOfActionSelectedNow", "mini"],
  data() {
    return {
      /**
       * Variável boleana usada para controlar a abertura do menu
       * true(abre) - false(fecha)
       */
      drawer: false,
      // mini: false,
      /**
       * Vetor usado para construir o submenu de Fluxos
       * {
       *  text: Nome que será apresentado no menu,
       *  icon: Imagem que será apresentada no menu,
       *  value: Valor usado para represetar a ação acionada ao clique
       * }
       */
      menuFlow: [
        {
          text: "Atributos",
          icon: "library_books",
          value: actionsType.edit
        },
        {
          text: "Entrada",
          icon: "arrow_upward",
          value: actionsType.addIn
        },
        {
          text: "Saída",
          icon: "arrow_downward",
          value: actionsType.addOut
        },
        {
          text: "Excluir",
          icon: "close",
          value: actionsType.remove
        }
      ],
      /**
       * Vetor usado para construir o submenu de Balanço
       */
      menuBalance: [
        {
          text: "Adicionar",
          icon: "trip_origin",
          value: actionsType.addBalance
        },
        {
          text: "Excluir",
          icon: "cancel",
          value: actionsType.removeBalance
        }
      ],
      /**
       * Vetor usado para construir o submenu de Modelo
       */
      menuModel: [
        {
          text: "Desfazer",
          icon: "undo",
          value: actionsType.undo
        },
        {
          text: "Refazer",
          icon: "redo",
          value: actionsType.redo
        },
        {
          text: "Salvar",
          icon: "save",
          value: actionsType.save
        },
        {
          text: "Reset",
          icon: "refresh",
          value: actionsType.reset
        },
        {
          text: "Configurações",
          icon: "settings",
          value: actionsType.config
        }
      ]
    };
  },
  methods: {
    /**
     * Emiti um evento que seleciona o tipo de clique no componente Tree
     * Tipos de Cliques:
     *  - Adiciona nó entrada
     *  - Adiciona nó saída
     *  - Remove nó
     *  - Adiciona balanço
     *  - Remove balanço
     *  - Editar propriedades do nó
     **/
    setTypeOfClick(type) {
      this.$emit("setTypeClickTree", type);
    },
    /**
     * Emiti um evento que executa o tipo de comando selecionado no componente Tree
     * Tipos de Commando:
     *  - Desfazer
     *  - Refazer
     *  - Salvar
     *  - Resetar
     **/
    executeModelCommand(type) {
      this.$emit("executeModelCommand", type);
    },
    /**
     * Aplica a classe 'active' caso seja a opção selecionada no menu
     */
    isActive(itemValue) {
      if (this.TypeOfActionSelectedNow === itemValue) return "active";
      else return "";
    }
  }
};
</script>

<style>
.active {
  background-color: #f5f5f5;
}
</style>
