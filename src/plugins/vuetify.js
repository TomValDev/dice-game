import Vue from "vue";
import Vuetify from "vuetify/lib/framework";

Vue.use(Vuetify);

export default new Vuetify({
  theme: {
    themes: {
      light: {
        primary: "#8bc34a",
        secondary: "#009688",
        accent: "#cddc39",
        error: "#ff5722",
        warning: "#ff9800",
        info: "#00bcd4",
        success: "#3f51b5",
      },
    },
  },
});
