import Vue from "vue";
import App from "./pages/Tree.vue";

import Vuetify from "vuetify";
import "vuetify/dist/vuetify.min.css";

import VueSweetalert2 from "vue-sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";

Vue.config.productionTip = false;

Vue.use(Vuetify);
Vue.use(VueSweetalert2);

new Vue({
  render: h => h(App)
}).$mount("#app");
