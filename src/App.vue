<template>
  <v-app>
    <v-app-bar app flat color="secondary">
      <v-app-bar-nav-icon>
        <v-img
          @click="loadMainIcon"
          max-height="50"
          max-width="50"
          :src="mainIconPath"
        />
      </v-app-bar-nav-icon>
    </v-app-bar>
    <v-main class="px-10">
      <v-row class="py-10">
        <v-col cols="3">
          <v-card>
            <v-container>
              <v-text-field v-model="name" label="Nom"></v-text-field>
              <v-btn color="primary" @click="connectAsync">Rejoindre</v-btn>
              <v-btn color="primary" v-if="isAdmin" @click="passTurn"
                >Pass!</v-btn
              >
            </v-container>
          </v-card>
          <v-card v-if="gameLive" class="mt-10">
            <v-list subheader>
              <v-subheader>Prochains joueurs</v-subheader>

              <v-list-item
                v-for="user in currentUserIndex == undefined
                  ? sortedUserList
                  : nextUsers"
                :key="user.id"
              >
                <v-list-item-avatar
                  v-if="nextUsers[nextUsers.length - 1].id === user.id"
                >
                  <v-icon color="secondary"> mdi-skip-next </v-icon>
                </v-list-item-avatar>
                <v-list-item-avatar v-else>
                  <v-icon> mdi-controller </v-icon>
                </v-list-item-avatar>

                <v-list-item-content>
                  <v-list-item-title v-text="user.name"></v-list-item-title>
                </v-list-item-content>

                <v-list-item-icon>
                  <v-img
                    v-if="user.lastRoll"
                    max-height="40"
                    max-width="40"
                    :src="loadIcon(user.lastRoll)"
                  />
                </v-list-item-icon>
              </v-list-item>
            </v-list>
            <v-divider></v-divider>
            <v-list v-if="currentUserIndex != undefined" subheader>
              <v-subheader>Tour du joueur</v-subheader>

              <v-list-item v-for="user in currentUser" :key="user.id">
                <v-list-item-content>
                  <v-list-item-title v-text="user.name"></v-list-item-title>
                </v-list-item-content>

                <v-list-item-icon>
                  <v-img
                    v-if="isRolling"
                    max-height="40"
                    max-width="40"
                    :src="isRollingPicture"
                  />
                  <v-img
                    v-if="rollingResult"
                    max-height="40"
                    max-width="40"
                    :src="loadIcon(rollingResult)"
                  />
                </v-list-item-icon>
              </v-list-item>
            </v-list>
          </v-card>
          <v-card v-if="!gameLive" class="mt-10">
            <v-list subheader>
              <v-subheader>Joueurs</v-subheader>

              <v-list-item v-for="user in users" :key="user.id">
                <v-list-item-avatar>
                  <v-icon> mdi-controller </v-icon>
                </v-list-item-avatar>

                <v-list-item-content>
                  <v-list-item-title v-text="user.name"></v-list-item-title>
                </v-list-item-content>
              </v-list-item>
            </v-list>
          </v-card>
        </v-col>
        <v-col>
          <v-card class="fill-height">
            <v-container class="fill-height pa-5">
              <v-row>
                <v-spacer></v-spacer>
                <v-btn @click="startGame" v-if="!gameLive" color="primary"
                  >Démarrer</v-btn
                >
                <v-img
                  v-if="isRolling"
                  max-height="150"
                  max-width="150"
                  :src="isRollingPicture"
                />
                <v-img
                  v-if="!isRolling && !rollingResult"
                  max-height="150"
                  max-width="150"
                  :src="loadIcon('base')"
                />
                <v-img
                  v-if="rollingResult"
                  max-height="150"
                  max-width="150"
                  :src="loadIcon(rollingResult)"
                />
                <v-spacer></v-spacer>
              </v-row>

              <v-row v-if="yourTurn && !rollingResult">
                <v-spacer></v-spacer>
                <v-btn
                  @click="rollDice"
                  class="mx-2"
                  v-if="!isRolling"
                  color="primary"
                  >Roll!</v-btn
                >
                <v-btn
                  @click="passTurn"
                  class="mx-2"
                  v-if="!isRolling"
                  color="primary"
                  >Pass!</v-btn
                >
                <v-btn
                  @click="stopDice"
                  class="mx-2"
                  v-if="isRolling"
                  color="primary"
                  >Stop!</v-btn
                >
                <v-spacer></v-spacer>
              </v-row>
              <v-row v-if="rollingResult">
                <v-row
                  class="fill-height"
                  align-content="center"
                  justify="center"
                >
                  <v-col class="text-subtitle-1 text-center" cols="12">
                    Prochain joueur : {{ nextUsers[nextUsers.length - 1].name }}
                  </v-col>
                  <v-col cols="6">
                    <v-progress-linear
                      color="primary"
                      indeterminate
                      rounded
                      height="6"
                    ></v-progress-linear>
                  </v-col>
                </v-row>
              </v-row>
            </v-container>
          </v-card>
        </v-col>
      </v-row>
    </v-main>
  </v-app>
</template>

<script>
import { WebPubSubServiceClient } from "@azure/web-pubsub";

export default {
  name: "App",
  components: {},
  created() {
    this.loadMainIcon();
    this.createSocket();
    this.connectAsync();
    setInterval(
      function () {
        this.time = Date.now();
      }.bind(this),
      60
    );
  },
  unmounted() {
    this.socket.removeEventListener();
    clearInterval();
  },
  data: () => ({
    sendClient: WebPubSubServiceClient,
    userId: Number,
    socket: WebSocket,
    mainIconPath: "",
    name: localStorage.name ?? "",
    users: [],
    currentUserIndex: undefined,
    isRolling: false,
    isRollingPicture: "",
    rollingResult: 0,
    time: Date.now(),
    isAdmin: localStorage.isAdmin ?? false,
  }),
  watch: {
    time() {
      var min = Math.ceil(1);
      var max = Math.floor(6);
      var number = Math.floor(Math.random() * (max - min + 1) + min);
      this.isRollingPicture = require(`./assets/${number}.png`);
    },
  },
  computed: {
    sortedUserList() {
      return this.users.map((_) => _).sort((a, b) => a.id - b.id);
    },
    nextUsers() {
      return [
        ...this.sortedUserList.slice(this.currentUserIndex + 1),
        ...this.sortedUserList.slice(0, this.currentUserIndex),
      ].reverse();
    },
    currentUser() {
      return [this.sortedUserList[this.currentUserIndex]];
    },
    yourTurn() {
      return (
        this.currentUser[0] &&
        this.currentUser[0].id &&
        this.currentUser[0].id === this.userId
      );
    },
    gameLive() {
      return (
        this.users &&
        this.users.length > 0 &&
        this.currentUserIndex !== undefined
      );
    },
  },
  methods: {
    loadMainIcon() {
      var min = Math.ceil(1);
      var max = Math.floor(6);
      var number = Math.floor(Math.random() * (max - min + 1) + min);
      this.mainIconPath = require(`./assets/${number}.png`);
    },
    loadIcon(number) {
      return require(`./assets/${number}.png`);
    },
    async createSocket() {
      var Endpoint =
        "Endpoint=https://pubsub-dicegame.webpubsub.azure.com;AccessKey=ozLUNOjDoN00tsFe1n7kudpXd2ak5ur303hUUx8Q2Gg=;Version=1.0;";
      this.sendClient = new WebPubSubServiceClient(Endpoint, "dicegame");
      var token = await this.sendClient.getClientAccessToken();

      this.socket = new WebSocket(token.url);
      this.socket.onmessage = async (event) => {
        let message = JSON.parse(event.data);
        await this.readMessage(message);
      };
    },
    async connectAsync() {
      this.userId = localStorage.userId ?? Math.floor(Math.random() * 1000000);
      await this.sendClient.sendToAll({
        senderId: this.userId,
        type: "CheckPresence",
      });
      localStorage.userId = this.userId;
    },
    async sendPresence() {
      if (this.name) {
        await this.sendClient.sendToAll({
          senderId: this.userId,
          type: "DeclarePresence",
          data: JSON.stringify({ id: this.userId, name: this.name }),
        });
        localStorage.name = this.name;
        await this.sendClient.sendToAll({
          senderId: this.userId,
          type: "PhaseInformation",
          data: this.currentUserIndex,
        });
      }
    },
    async startGame() {
      await this.sendClient.sendToAll({
        senderId: this.userId,
        type: "PhaseInformation",
        data: 0,
      });
    },
    async rollDice() {
      await this.sendClient.sendToAll({
        senderId: this.userId,
        type: "RollStart",
      });
      await this.sendClient.sendToAll({
        senderId: this.userId,
        type: "CheckPresence",
      });
    },
    async stopDice() {
      var min = Math.ceil(1);
      var max = Math.floor(6);
      var number = Math.floor(Math.random() * (max - min + 1) + min);
      await this.sendClient.sendToAll({
        senderId: this.userId,
        type: "RollResult",
        data: number,
      });
      await new Promise((resolve) => setTimeout(resolve, 3000));
      await this.sendClient.sendToAll({
        senderId: this.userId,
        type: "NextPhase",
      });
    },
    async passTurn() {
      await this.sendClient.sendToAll({
        senderId: this.userId,
        type: "NextPhase",
      });
    },
    readMessage(message) {
      switch (message.type) {
        case "CheckPresence": {
          this.sendPresence();
          break;
        }
        case "DeclarePresence": {
          let declaredUser = JSON.parse(message.data);
          if (declaredUser.id) {
            if (
              this.users.length === 0 ||
              this.users.filter((user) => user.id == declaredUser.id).length ===
                0
            ) {
              this.users.push(declaredUser);
            } else {
              this.users = this.users.map((u) =>
                u.id == declaredUser.id ? { ...u, name: declaredUser.name } : u
              );
            }
          }
          console.log(this.users);
          break;
        }
        case "RollStart": {
          this.isRolling = true;
          break;
        }
        case "RollResult": {
          this.isRolling = false;
          this.rollingResult = message.data;
          this.users = this.users.map((u) =>
            u.id == message.senderId ? { ...u, lastRoll: message.data } : u
          );
          break;
        }
        case "PhaseInformation": {
          let currentUser = message.data;
          this.currentUserIndex = currentUser;
          break;
        }
        case "NextPhase": {
          this.isRolling = false;
          this.rollingResult = false;
          var nextuserIndex = this.currentUserIndex + 1;
          if (nextuserIndex == this.users.length) {
            nextuserIndex = 0;
          }
          this.currentUserIndex = nextuserIndex;
          break;
        }
      }
    },
  },
};
</script>
