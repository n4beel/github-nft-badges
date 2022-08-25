const dateOptions = { month: "short", day: "numeric" };

let calendarGraph;
let contributionsBox;
let yearTotal = 0;
let weekTotal = 0;
let averageCount = 0;
let maxCount = 0;
let countTotal = 0;
let weekCountTotal = 0;
let streakLongest = 0;
let streakCurrent = 0;
let bestDay = null;
let firstDay = null;
let lastDay = null;
let datesTotal = null;
let weekStartDay = null;
let weekDatesTotal = null;
let datesLongest = null;
let datesCurrent = null;
let dateBest = null;
let toggleSetting = "cubes";

const resetValues = () => {
  yearTotal = 0;
  averageCount = 0;
  maxCount = 0;
  streakLongest = 0;
  streakCurrent = 0;
  weekTotal = 0;
  bestDay = null;
  firstDay = null;
  lastDay = null;
  datesLongest = null;
  datesCurrent = null;
  weekStartDay = null;
};

const getSettings = () => {
  return new Promise((resolve) => {
    // Check for user preference, if chrome.storage is available.
    // The storage API is not supported in content scripts.
    // https://developer.mozilla.org/Add-ons/WebExtensions/Chrome_incompatibilities#storage
    if (chrome && chrome.storage) {
      chrome.storage.local.get(["toggleSetting"], (settings) => {
        toggleSetting = settings.toggleSetting
          ? settings.toggleSetting
          : "cubes";
        resolve("Settings loaded");
      });
    } else {
      toggleSetting = localStorage.toggleSetting
        ? localStorage.toggleSetting
        : "cubes";
      resolve("Settings loaded");
    }
  });
};

const persistSetting = (key, value) => {
  if (chrome && chrome.storage) {
    const object = {};
    object[key] = value;
    chrome.storage.local.set(object);
  } else {
    localStorage[key] = value;
  }
};

// const initUI = () => {
//   const contributionsWrapper = document.createElement("div");
//   contributionsWrapper.className = "ic-contributions-wrapper position-relative";
//   calendarGraph.before(contributionsWrapper);

//   const canvas = document.createElement("canvas");
//   canvas.id = "isometric-contributions";
//   canvas.width = 1000;
//   canvas.height = 600;
//   canvas.style.width = "100%";
//   contributionsWrapper.append(canvas);

//   // Inject toggle
//   let insertLocation = contributionsBox.querySelector("h2");
//   if (
//     insertLocation.previousElementSibling &&
//     insertLocation.previousElementSibling.nodeName === "DETAILS"
//   ) {
//     insertLocation = insertLocation.previousElementSibling;
//   }

//   const btnGroup = document.createElement("div");
//   btnGroup.className = "BtnGroup mt-1 ml-3 position-relative top-0 float-right";

//   const squaresButton = document.createElement("button");
//   squaresButton.innerHTML = "2D";
//   squaresButton.className =
//     "ic-toggle-option squares btn BtnGroup-item btn-sm py-0 px-1";
//   squaresButton.dataset.icOption = "squares";
//   squaresButton.addEventListener("click", handleViewToggle);
//   if (toggleSetting === "squares") {
//     squaresButton.classList.add("selected");
//   }

//   const cubesButton = document.createElement("button");
//   cubesButton.innerHTML = "3D";
//   cubesButton.className =
//     "ic-toggle-option cubes btn BtnGroup-item btn-sm py-0 px-1";
//   cubesButton.dataset.icOption = "cubes";
//   cubesButton.addEventListener("click", handleViewToggle);
//   if (toggleSetting === "cubes") {
//     cubesButton.classList.add("selected");
//   }

//   btnGroup.append(squaresButton);
//   btnGroup.append(cubesButton);
//   insertLocation.before(btnGroup);

//   setContainerViewType(toggleSetting);
// };

const handleViewToggle = (event) => {
  setContainerViewType(event.target.dataset.icOption);

  for (const toggle of document.querySelectorAll(".ic-toggle-option")) {
    toggle.classList.remove("selected");
  }

  event.target.classList.add("selected");

  persistSetting("toggleSetting", event.target.dataset.icOption);
  toggleSetting = event.target.dataset.icOption;

  // Apply user preference
  document
    .querySelector(`.ic-toggle-option.${toggleSetting}`)
    .classList.add("selected");
  contributionsBox.classList.add(`ic-${toggleSetting}`);
};

const setContainerViewType = (type) => {
  if (type === "squares") {
    contributionsBox.classList.remove("ic-cubes");
    contributionsBox.classList.add("ic-squares");
  } else {
    contributionsBox.classList.remove("ic-squares");
    contributionsBox.classList.add("ic-cubes");
  }
};

const loadStats = () => {
  let temporaryStreak = 0;
  let temporaryStreakStart = null;
  let longestStreakStart = null;
  let longestStreakEnd = null;
  let currentStreakStart = null;
  let currentStreakEnd = null;

  const days = document.querySelectorAll(".js-calendar-graph rect[data-date]");
  const currentWeekDays =
    days[days.length - 1].parentElement.querySelectorAll("rect[data-date]");

  for (const d of days) {
    const currentDayCount = Number.parseInt(d.dataset.count, 10);
    yearTotal += Number.parseInt(currentDayCount, 10);

    if (days[0] === d) {
      firstDay = d.dataset.date;
    }

    if (days[days.length - 1] === d) {
      lastDay = d.dataset.date;
    }

    // Check for best day
    if (currentDayCount > maxCount) {
      bestDay = d.dataset.date;
      maxCount = currentDayCount;
    }

    // Check for longest streak
    if (currentDayCount > 0) {
      if (temporaryStreak === 0) {
        temporaryStreakStart = d.dataset.date;
      }

      temporaryStreak++;

      if (temporaryStreak >= streakLongest) {
        longestStreakStart = temporaryStreakStart;
        longestStreakEnd = d.dataset.date;
        streakLongest = temporaryStreak;
      }
    } else {
      temporaryStreak = 0;
      temporaryStreakStart = null;
    }
  }

  for (const d of currentWeekDays) {
    const currentDayCount = Number.parseInt(d.dataset.count, 10);
    weekTotal += Number.parseInt(currentDayCount, 10);

    if (currentWeekDays[0] === d) {
      weekStartDay = d.dataset.date;
    }
  }

  // Check for current streak
  // Convert days NodeList to Array so we can reverse it
  const daysArray = Array.prototype.slice.call(days);
  daysArray.reverse();

  currentStreakEnd = daysArray[0].dataset.date;

  for (let i = 0; i < daysArray.length; i++) {
    const currentDayCount = Number.parseInt(daysArray[i].dataset.count, 10);
    // If there's no activity today, continue on to yesterday
    if (i === 0 && currentDayCount === 0) {
      currentStreakEnd = daysArray[1].dataset.date;
      continue;
    }

    if (currentDayCount > 0) {
      streakCurrent++;
      currentStreakStart = daysArray[i].dataset.date;
    } else {
      break;
    }
  }

  if (streakCurrent > 0) {
    currentStreakStart = formatDateString(currentStreakStart, dateOptions);
    currentStreakEnd = formatDateString(currentStreakEnd, dateOptions);
    datesCurrent = `${currentStreakStart} → ${currentStreakEnd}`;
  } else {
    datesCurrent = "No current streak";
  }

  // Year total
  countTotal = yearTotal.toLocaleString();
  const dateFirst = formatDateString(firstDay, dateOptions);
  const dateLast = formatDateString(lastDay, dateOptions);
  datesTotal = `${dateFirst} → ${dateLast}`;

  // Average contributions per day
  const dayDifference = datesDayDifference(firstDay, lastDay);
  averageCount = precisionRound(yearTotal / dayDifference, 2);

  // Best day
  dateBest = formatDateString(bestDay, dateOptions);
  if (!dateBest) {
    dateBest = "No activity found";
  }

  // Longest streak
  if (streakLongest > 0) {
    longestStreakStart = formatDateString(longestStreakStart, dateOptions);
    longestStreakEnd = formatDateString(longestStreakEnd, dateOptions);
    datesLongest = `${longestStreakStart} → ${longestStreakEnd}`;
  } else {
    datesLongest = "No longest streak";
  }

  // Week total
  weekCountTotal = weekTotal.toLocaleString();
  const weekDateFirst = formatDateString(weekStartDay, dateOptions);
  weekDatesTotal = `${weekDateFirst} → ${dateLast}`;
};

const rgbToHex = (rgb) => {
  const sep = rgb.includes(",") ? "," : " ";
  rgb = rgb.slice(4).split(")")[0].split(sep);

  let r = Number(rgb[0]).toString(16);
  let g = Number(rgb[1]).toString(16);
  let b = Number(rgb[2]).toString(16);

  if (r.length === 1) {
    r = "0" + r;
  }

  if (g.length === 1) {
    g = "0" + g;
  }

  if (b.length === 1) {
    b = "0" + b;
  }

  return r + g + b;
};

// const getSquareColor = (rect) => {
//   const fill = getComputedStyle(rect).getPropertyValue('fill')
//   const rgb = rgbToHex(fill)
//   return new obelisk.CubeColor().getByHorizontalColor(Number.parseInt(rgb, 16))
// }

// const renderIsometricChart = () => {
//   const SIZE = 16
//   const MAX_HEIGHT = 100
//   const firstRect = document.querySelectorAll('.js-calendar-graph-svg g > g')[1]
//   const canvas = document.querySelector('#isometric-contributions')
//   const GH_OFFSET = Number.parseInt(firstRect.getAttribute('transform').match(/(\d+)/)[0], 10) - 1
//   const point = new obelisk.Point(130, 90)
//   const pixelView = new obelisk.PixelView(canvas, point)
//   const weeks = document.querySelectorAll('.js-calendar-graph-svg g > g')

//   for (const w of weeks) {
//     const x = Number.parseInt(w.getAttribute('transform').match(/(\d+)/)[0], 10) / (GH_OFFSET + 1)
//     for (const r of w.querySelectorAll('rect')) {
//       const y = Number.parseInt(r.getAttribute('y'), 10) / GH_OFFSET
//       const contribCount = Number.parseInt(r.dataset.count, 10)
//       let cubeHeight = 3

//       if (maxCount > 0) {
//         cubeHeight += Number.parseInt((MAX_HEIGHT / maxCount) * contribCount, 10)
//       }

//       const dimension = new obelisk.CubeDimension(SIZE, SIZE, cubeHeight)
//       const color = getSquareColor(r)
//       const cube = new obelisk.Cube(dimension, color, false)
//       const p3d = new obelisk.Point3D(SIZE * x, SIZE * y, 0)
//       pixelView.renderObject(cube, p3d)
//     }
//   }
// }

const renderBadges = () => {
  const extraHtml = `
    <div class="border-top color-border-muted pt-3 mt-3 d-none d-md-block">
      <h2 class="h4 mb-2">Badges</h2>
      <div class="d-flex flex-wrap">
        <a href="/n4beel?achievement=quickdraw&amp;tab=achievements" class="position-relative">
        <img src="https://github.githubassets.com/images/modules/profile/achievements/quickdraw-default.png" data-hovercard-type="achievement" data-hovercard-url="/users/n4beel/achievements/quickdraw/detail?hovercard=1" width="64" alt="Achievement: Quickdraw" data-view-component="true" class="achievement-badge-sidebar">
        </a>
        <a href="/n4beel?achievement=pull-shark&amp;tab=achievements" class="position-relative">
          <img src="https://github.githubassets.com/images/modules/profile/achievements/pull-shark-default.png" data-hovercard-type="achievement" data-hovercard-url="/users/n4beel/achievements/pull-shark/detail?hovercard=1" width="64" alt="Achievement: Pull Shark" data-view-component="true" class="achievement-badge-sidebar">
          <span data-view-component="true" class="Label achievement-tier-label achievement-tier-label--bronze text-small text-bold color-shadow-medium px-2 py-0 mb-1 position-absolute right-0 bottom-0">x2</span>
        </a>
      </div>
    </div>
    `;

  document.querySelector(".js-profile-editable-replace").innerHTML += extraHtml;
};

const generateIsometricChart = () => {
  calendarGraph = document.querySelector(".js-calendar-graph");
  contributionsBox = document.querySelector(".js-yearly-contributions");

  // resetValues();
  // initUI();
  loadStats();
  renderBadges();
  // renderIsometricChart();
};

const precisionRound = (number, precision) => {
  const factor = 10 ** precision;
  return Math.round(number * factor) / factor;
};

const datesDayDifference = (dateString1, dateString2) => {
  let diffDays = null;
  let date1 = null;
  let date2 = null;

  if (dateString1) {
    const dateParts = dateString1.split("-");
    date1 = new Date(dateParts[0], dateParts[1] - 1, dateParts[2], 0, 0, 0);
  }

  if (dateString2) {
    const dateParts = dateString2.split("-");
    date2 = new Date(dateParts[0], dateParts[1] - 1, dateParts[2], 0, 0, 0);
  }

  if (dateString1 && dateString2) {
    const timeDiff = Math.abs(date2.getTime() - date1.getTime());
    diffDays = Math.ceil(timeDiff / (1000 * 3600 * 24));
  }

  return diffDays;
};

const formatDateString = (dateString, options) => {
  let date = null;

  if (dateString) {
    const dateParts = dateString.split("-");
    date = new Date(
      dateParts[0],
      dateParts[1] - 1,
      dateParts[2],
      0,
      0,
      0
    ).toLocaleDateString("en-US", options);
  }

  return date;
};

if (document.querySelector(".js-calendar-graph")) {
  const settingsPromise = getSettings();
  settingsPromise.then(generateIsometricChart);

  const config = { attributes: true, childList: true, subtree: true };
  const callback = (mutationsList) => {
    for (const mutation of mutationsList) {
      if (mutation.type === "childList") {
        for (const node of mutation.addedNodes) {
          if (
            node.classList &&
            node.classList.contains("js-yearly-contributions")
          ) {
            generateIsometricChart();
          }
        }
      }
    }
  };

  window.matchMedia("(prefers-color-scheme: dark)").addListener(() => {
    // renderIsometricChart();
  });

  const observedContainer = document.querySelector("html");
  const observer = new MutationObserver(callback);
  observer.observe(observedContainer, config);
}
