const DateTime = luxon.DateTime;

let formatTime = function (timeformat, date, tz) {
  try {
    date =
      date !== undefined ? DateTime.fromISO(date.toString()) : DateTime.now();
    if (tz) {
      date = date.setZone(tz);
    }
    return timeformat === "12"
      ? date.toFormat("hh:mm a")
      : date.toFormat("HH:mm");
  } catch (error) {
    console.error(error, { timeformat, date, tz });
  }
};

function getRandomIntInclusive(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1) + min); //The maximum is inclusive and the minimum is inclusive
}

let formatDate = function (dateformat, source, tz) {
  let converted = DateTime.fromISO(source.toString());
  converted = converted.setZone(tz);
  let today = DateTime.now();
  return dateformat === "time"
    ? converted.day < today.day
      ? "Previous Day"
      : converted.day > today.day
      ? "Next Day"
      : "Today"
    : converted.toFormat("dd MMM yyyy");
};

Vue.component("timezone-card", {
  props: ["dateformat", "timezone", "source"],
  data: function () {
    return {
      color: "color-" + getRandomIntInclusive(1, 5),
    };
  },
  computed: {
    convertedDateTime: function () {
      return formatTime(
        this.timezone.timeformat,
        this.source,
        this.timezone.tz
      );
    },
  },
  mounted: function () {
    $(`#timezone-dd-${this.timezone.id}`)
      .select2({
        placeholder: "Select Timezone",
      })
      .on("change", this.updateTimezone);
  },
  methods: {
    updateTimeFormat: function (format) {
      this.timezone.timeformat = format;
      console.log(this.timezone);
      this.$emit("syncstorage");
    },
    updateTimezone: function (e) {
      this.timezone.tz = e.target.value;
      this.$emit("syncstorage");
    },
    syncTimezone: function (e) {
      let dt = DateTime.fromFormat(
        e.target.value,
        this.timezone.timeformat === "12" ? "hh:mm a" : "HH:mm",
        { zone: this.timezone.tz }
      );
      if (dt.isValid) {
        this.$emit("synctimezone", dt);
      }
    },
  },
  template: `
  <div class="flex tag" v-bind:id="'timezone-card-' + timezone.id">
    <div class="flex title" v-bind:class="[color]">
      <input
        type="text"
        name="title"
        id=""
        value="Some title"
        placeholder="Title"
        v-model="timezone.title"
        v-on:keyup.13="$emit('syncstorage')"
      />
      <span class="close" title="Remove this" v-on:click="$emit('removetimezone', timezone.id)">x</span>
    </div>
    <div class="flex content">
      <input
        type="text"
        name="time"
        placeholder="Time"
        v-bind:value="convertedDateTime"
        v-on:keyup.13="syncTimezone"
      />
      <small v-if="dateformat==='time'">{{formatDate(dateformat, source, timezone.tz)}}</small>
    </div>
    <div class="flex footer">
      <time-format v-on:updateformat="updateTimeFormat" v-bind:timeformat="timezone.timeformat"></time-format>
      <select 
        placeholder="Select Timezone" 
        class="timezone" 
        name="timezone" 
        v-bind:id="'timezone-dd-' + timezone.id"
        v-model="timezone.tz">
        <option v-for="tz in window.timezones" v-bind:value="tz">{{tz}}</option>
      </select>
    </div>
  </div>`,
});

Vue.component("date-format", {
  props: ["dateformat"],
  template: `<div class="flex date-format">
  <label class="radio" v-bind:class="{ 'active': dateformat=== 'time' }"
    ><input
      checked
      type="radio"
      name="date-format"
      id=""
      value="time"
      v-model="dateformat"
      v-on:click="$emit('updateformat', 'time')"
    />Time</label
  >
  <label class="radio" v-bind:class="{ 'active': dateformat=== 'datetime' }"
    ><input
      type="radio"
      name="date-format"
      id=""
      value="datetime"
      v-model="dateformat"
      v-on:click="$emit('updateformat', 'datetime')"
    />Date &amp; Time</label
  >
</div>`,
});

// Define a new component called time-format
Vue.component("time-format", {
  props: ["timeformat"],
  template: `<div class="flex time-format">
  <label class="radio" v-bind:class="{ 'active': timeformat=== '12' }"
    ><input
      checked
      type="radio"
      name="time-format"
      id=""
      value="12"
      v-model="timeformat"
      v-on:click="$emit('updateformat', '12')"
    />12</label
  >
  <label class="radio" v-bind:class="{ 'active': timeformat=== '24' }"
    ><input
      type="radio"
      name="time-format"
      id=""
      value="24"
      v-model="timeformat"
      v-on:click="$emit('updateformat', '24')"
    />24</label
  >
</div>`,
});

var app = new Vue({
  el: "#app",
  data: {
    dateformat: "time",
    timeformat: "12",
    message: "Hello Vue!",
    timezones: [],
    currentTzId: 0,
    currentDateTime: luxon.DateTime.now(),
    source: DateTime.now().setZone("UTC"),
  },
  created: function () {
    let tzs = localStorage.getItem("timezones");
    let source = localStorage.getItem("source");
    let dateformat = localStorage.getItem("dateformat");
    let timeformat = localStorage.getItem("timeformat");
    if (tzs) {
      tzs = JSON.parse(tzs);
      tzs.forEach((tz) =>
        this.timezones.push({
          id: tz.id,
          title: tz.title,
          tz: tz.tz,
          timeformat: tz.timeformat,
        })
      );
      if (source) {
        this.source = DateTime.fromISO(source).setZone("UTC");
      }
      if (dateformat) {
        this.dateformat = dateformat;
      }
      if (timeformat) {
        this.timeformat = timeformat;
      }
    }

    setInterval(function () {
      this.currentDateTime = DateTime.now();
    }, 60 * 1000);
  },
  computed: {
    localTime: function () {
      return formatTime(this.timeformat, this.currentDateTime);
    },
    utcTime: function () {
      let d = new Date();
      return formatTime(this.timeformat, this.currentDateTime, "UTC");
    },
  },
  methods: {
    updateTimeFormat: function (format) {
      this.timeformat = format;
      this.syncStorage();
    },
    updateDateFormat: function (format) {
      this.dateformat = format;
      this.syncStorage();
    },
    syncStorage: function () {
      let tzs = [];
      this.timezones.forEach((tz) =>
        tzs.push({
          id: tz.id,
          title: tz.title,
          tz: tz.tz,
          timeformat: tz.timeformat,
        })
      );
      localStorage.setItem("timezones", JSON.stringify(tzs));
      localStorage.setItem("source", this.source.toISO());
      localStorage.setItem("dateformat", this.dateformat);
      localStorage.setItem("timeformat", this.timeformat);
    },
    addTimezone: function () {
      this.currentTzId += 1;
      let tz = getRandomIntInclusive(0, window.timezones.length - 1);
      this.timezones.push({
        id: this.currentTzId,
        title: "Timezone - " + this.currentTzId,
        tz: window.timezones[tz],
        timeformat: "12",
      });
      this.syncStorage();
    },
    removeTimezone: function (id) {
      let index = -1;
      id = parseInt(id);
      this.timezones.forEach((tz) => {
        index += 1;
        if (tz.id === id) {
          return false;
        }
      });

      if (index > -1) {
        this.timezones.splice(index, 1);
      }
      this.syncStorage();
    },
    syncTimezone: function (updated) {
      updated = updated.setZone("UTC");
      this.source = this.source.set({
        hour: updated.hour,
        minute: updated.minute,
      });
      this.syncStorage();
    },
  },
});
