const searchInput = document.getElementById("searchInput");
const venueFilter = document.getElementById("venueFilter");
const cityFilter = document.getElementById("cityFilter");
const stateFilter = document.getElementById("stateFilter");
const tourFilter = document.getElementById("tourFilter");
const yearFilter = document.getElementById("yearFilter");
const sortFilter = document.getElementById("sortFilter");
const clearFiltersButton = document.getElementById("clearFilters");
const showList = document.getElementById("showList");
const totalCount = document.getElementById("totalCount");
const rangeCount = document.getElementById("rangeCount");
const showCardTemplate = document.getElementById("showCardTemplate");
const setlistModal = document.getElementById("setlistModal");
const modalTitle = document.getElementById("modalTitle");
const modalSubtitle = document.getElementById("modalSubtitle");
const modalBody = document.getElementById("modalBody");

const FORMAT_LABELS = {
  cd: "CD",
  cd_box: "CD Box",
  vinyl: "Vinyl",
  vinyl_box: "Vinyl Box",
  cassette: "Cassette",
};

const SERIES_LABELS = {
  DavesPicks: "DaP",
  DicksPicks: "DiP",
};

const parseDate = (value) => new Date(`${value}T00:00:00`);

const formatDate = (value) =>
  parseDate(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

const formatLocation = (show) =>
  [show.city, show.state, show.country].filter(Boolean).join(", ");

const buildYearOptions = (shows) => {
  const years = Array.from(new Set(shows.map((show) => show.date.slice(0, 4))))
    .sort()
    .reverse();

  yearFilter.innerHTML = "";
  const allOption = document.createElement("option");
  allOption.value = "all";
  allOption.textContent = "All years";
  yearFilter.appendChild(allOption);

  years.forEach((year) => {
    const option = document.createElement("option");
    option.value = year;
    option.textContent = year;
    yearFilter.appendChild(option);
  });
};

const normalizeTour = (tour) => tour && tour.trim() ? tour.trim() : "Non-tour";

const buildSelectOptions = (selectEl, values, label) => {
  selectEl.innerHTML = "";
  const allOption = document.createElement("option");
  allOption.value = "all";
  allOption.textContent = label;
  selectEl.appendChild(allOption);

  values.forEach((value) => {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = value;
    selectEl.appendChild(option);
  });
};

const buildTourOptions = (shows) => {
  const tours = Array.from(
    new Set(shows.map((show) => normalizeTour(show.tour)))
  ).sort();

  buildSelectOptions(tourFilter, tours, "All tours");
};

const buildVenueCityStateOptions = (shows) => {
  const venues = Array.from(
    new Set(shows.map((show) => show.venue).filter(Boolean))
  ).sort();
  const cities = Array.from(
    new Set(shows.map((show) => show.city).filter(Boolean))
  ).sort();
  const states = Array.from(
    new Set(shows.map((show) => show.state).filter(Boolean))
  ).sort();

  buildSelectOptions(venueFilter, venues, "All venues");
  buildSelectOptions(cityFilter, cities, "All cities");
  buildSelectOptions(stateFilter, states, "All states");
};

const normalizeSets = (show) => {
  if (Array.isArray(show.sets) && show.sets.length) {
    return show.sets
      .map((set) => ({
        name: set.name || "Set",
        songs: Array.isArray(set.songs) ? set.songs : [],
      }))
      .filter((set) => set.songs.length);
  }
  if (Array.isArray(show.setlist) && show.setlist.length) {
    return [{ name: "Set 1", songs: show.setlist }];
  }
  return [];
};

const normalizeShowId = (show) => show.id || show.date;

const getSongTitle = (song) =>
  typeof song === "string" ? song : song?.title || "";

const getSongDuration = (song) =>
  typeof song === "object" && song?.duration ? song.duration : "";

const getSongReleases = (song) =>
  typeof song === "object" && Array.isArray(song?.releases)
    ? song.releases
    : [];

const getReleaseLabel = (release) => {
  if (!release) return "Release";
  const prefix = SERIES_LABELS[release.series];
  if (prefix && release.number) return `${prefix} ${release.number}`;
  if (release.number) return `${release.title} ${release.number}`;
  return release.title || "Release";
};

const collectReleaseUsage = (show) => {
  const usage = new Map();
  const sets = normalizeSets(show);
  let totalSongs = 0;
  sets.forEach((set) => {
    set.songs.forEach((song) => {
      totalSongs += 1;
      getSongReleases(song).forEach((releaseId) => {
        usage.set(releaseId, (usage.get(releaseId) || 0) + 1);
      });
    });
  });
  return { usage, totalSongs };
};

const buildHaystack = (show) => {
  const setlist = normalizeSets(show)
    .flatMap((set) => set.songs.map(getSongTitle))
    .join(" ");
  const { usage } = collectReleaseUsage(show);
  const releaseTitles = Array.from(usage.keys())
    .map((id) => releasesById.get(id)?.title)
    .filter(Boolean)
    .join(" ");
  return [
    show.date,
    show.venue,
    show.city,
    show.state,
    show.country,
    normalizeTour(show.tour),
    setlist,
    releaseTitles,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
};

const renderShows = (shows) => {
  showList.innerHTML = "";
  const fragment = document.createDocumentFragment();

  const showsByYear = new Map();
  shows.forEach((show) => {
    const year = show.date.slice(0, 4);
    const list = showsByYear.get(year) || [];
    list.push(show);
    showsByYear.set(year, list);
  });

  Array.from(showsByYear.entries())
    .sort((a, b) => (sortFilter.value === "asc" ? a[0] - b[0] : b[0] - a[0]))
    .forEach(([year, yearShows]) => {
      const yearBlock = document.createElement("div");
      yearBlock.className = "year-block";

      const header = document.createElement("div");
      header.className = "year-header";
      header.textContent = year;
      const line = document.createElement("div");
      line.className = "year-line";
      header.appendChild(line);

      const grid = document.createElement("div");
      grid.className = "show-grid";

      yearShows.forEach((show) => {
        const card = showCardTemplate.content.cloneNode(true);
        const showId = normalizeShowId(show);
        card.querySelector(".show-date").textContent = formatDate(show.date);
        const venueEl = card.querySelector(".show-venue");
        venueEl.textContent = show.venue || "Venue TBA";
        venueEl.dataset.venue = show.venue || "";

        const cityEl = card.querySelector(".show-city");
        cityEl.textContent = show.city || "City TBA";
        cityEl.dataset.city = show.city || "";

        const stateEl = card.querySelector(".show-state");
        stateEl.textContent = show.state || "State TBA";
        stateEl.dataset.state = show.state || "";

        const tourEl = card.querySelector(".show-tour");
        if (tourEl) {
          const tourLabel = normalizeTour(show.tour);
          tourEl.textContent = tourLabel;
          tourEl.dataset.tour = tourLabel;
        }

        const setlistEl = card.querySelector(".show-setlist");
        const sets = normalizeSets(show);
        if (sets.length) {
          setlistEl.innerHTML = "";
          sets.forEach((set) => {
            const section = document.createElement("div");
            section.className = "setlist-section";
            const title = document.createElement("div");
            title.className = "setlist-title";
            title.textContent = set.name;
            section.appendChild(title);

            const inline = document.createElement("div");
            inline.className = "setlist-inline";
            set.songs.forEach((song, index) => {
              const span = document.createElement("span");
              const title = getSongTitle(song);
              span.textContent = `${index + 1}. ${title}`;
              inline.appendChild(span);
            });
            section.appendChild(inline);
            setlistEl.appendChild(section);
          });
        } else {
          setlistEl.textContent = "Setlist unavailable";
        }

        const button = card.querySelector(".setlist-button");
        if (sets.length) {
          button.dataset.showId = showId;
        } else {
          button.style.display = "none";
        }

        const badgesEl = card.querySelector(".release-badges");
        const artEl = card.querySelector(".release-art");
        if (badgesEl && artEl) {
          const { usage, totalSongs } = collectReleaseUsage(show);
          const linkList = linksByShow.get(showId) || [];
          if (usage.size || linkList.length) {
            const releaseIds = new Set([
              ...Array.from(usage.keys()),
              ...linkList.map((link) => link.release_id),
            ]);
            Array.from(releaseIds).forEach((releaseId) => {
              const release = releasesById.get(releaseId);
              if (!release) return;
              const chip = document.createElement("div");
              let coverage = "full";
              if (usage.size) {
                const count = usage.get(releaseId) || 0;
                coverage = count === totalSongs ? "full" : "partial";
              } else {
                const link = linkList.find((item) => item.release_id === releaseId);
                coverage = link?.coverage || "partial";
              }
              chip.className = `release-chip ${coverage}`;
              chip.textContent = release.title;
              const format = document.createElement("span");
              format.className = "release-format";
              format.textContent =
                FORMAT_LABELS[release.format] || release.format || "Release";
              chip.appendChild(format);
              badgesEl.appendChild(chip);

              if (release.cover_art_url) {
                const img = document.createElement("img");
                img.src = release.cover_art_url;
                img.alt = release.title;
                artEl.appendChild(img);
              }
            });
          } else {
            badgesEl.textContent = "No commercial release noted";
          }
        }

        grid.appendChild(card);
      });

      yearBlock.appendChild(header);
      yearBlock.appendChild(grid);
      fragment.appendChild(yearBlock);
    });

  showList.appendChild(fragment);
};

const loadShows = async () => {
  if (Array.isArray(window.SHOWS)) {
    return window.SHOWS;
  }

  const response = await fetch("data/shows.json");
  if (!response.ok) {
    throw new Error("Unable to load data/shows.json");
  }
  const data = await response.json();
  return Array.isArray(data.shows) ? data.shows : [];
};

const openModal = (show) => {
  modalTitle.textContent = formatDate(show.date);
  modalSubtitle.textContent = `${show.venue || "Venue TBA"} · ${
    formatLocation(show) || "Location TBA"
  }`;

  modalBody.innerHTML = "";
  const showId = normalizeShowId(show);
  const links = linksByShow.get(showId) || [];
  const { usage, totalSongs } = collectReleaseUsage(show);
  const releaseIds = new Set([
    ...links.map((link) => link.release_id),
    ...Array.from(usage.keys()),
  ]);
  if (releaseIds.size) {
    const releaseWrap = document.createElement("div");
    releaseWrap.className = "modal-setlist";
    const title = document.createElement("div");
    title.className = "setlist-title";
    title.textContent = "Commercial Releases";
    releaseWrap.appendChild(title);

    const list = document.createElement("ol");
    list.className = "setlist-list";
    Array.from(releaseIds).forEach((releaseId) => {
      const release = releasesById.get(releaseId);
      if (!release) return;
      const li = document.createElement("li");
      const formatLabel =
        FORMAT_LABELS[release.format] || release.format || "Release";
      let coverage = "partial";
      if (usage.size) {
        const count = usage.get(releaseId) || 0;
        coverage = count === totalSongs ? "full" : "partial";
      } else {
        const link = links.find((item) => item.release_id === releaseId);
        coverage = link?.coverage || "partial";
      }
      li.textContent = `${release.title} (${formatLabel}, ${coverage})`;
      list.appendChild(li);
    });
    releaseWrap.appendChild(list);
    modalBody.appendChild(releaseWrap);
  }

  const sets = normalizeSets(show);
  sets.forEach((set) => {
    const wrap = document.createElement("div");
    wrap.className = "modal-setlist";

    const title = document.createElement("div");
    title.className = "setlist-title";
    title.textContent = set.name;
    wrap.appendChild(title);

    const list = document.createElement("ol");
    list.className = "setlist-list";
    set.songs.forEach((song) => {
      const li = document.createElement("li");
      const titleText = getSongTitle(song);
      const duration = getSongDuration(song);
      const releaseLabels = getSongReleases(song)
        .map((releaseId) => releasesById.get(releaseId))
        .filter(Boolean)
        .map(getReleaseLabel);
      li.textContent = titleText;
      if (duration || releaseLabels.length) {
        const meta = document.createElement("span");
        meta.className = "modal-track-meta";
        const parts = [];
        if (duration) {
          const time = document.createElement("span");
          time.textContent = duration;
          parts.push(time);
        }
        if (parts.length) {
          parts.forEach((item) => meta.appendChild(item));
        }
        releaseLabels.forEach((label) => {
          const tag = document.createElement("span");
          tag.className = "release-tag";
          tag.textContent = label;
          meta.appendChild(tag);
        });
        li.appendChild(meta);
      }
      list.appendChild(li);
    });
    wrap.appendChild(list);

    modalBody.appendChild(wrap);
  });

  setlistModal.classList.add("is-open");
  setlistModal.setAttribute("aria-hidden", "false");
};

const closeModal = () => {
  setlistModal.classList.remove("is-open");
  setlistModal.setAttribute("aria-hidden", "true");
};

let releasesById = new Map();
let linksByShow = new Map();

const resetFilters = () => {
  searchInput.value = "";
  venueFilter.value = "all";
  cityFilter.value = "all";
  stateFilter.value = "all";
  tourFilter.value = "all";
  yearFilter.value = "all";
  sortFilter.value = "asc";
};

const init = async () => {
  try {
    const releases = Array.isArray(window.RELEASES) ? window.RELEASES : [];
    releasesById = new Map(releases.map((release) => [release.id, release]));
    linksByShow = new Map();
    const links = Array.isArray(window.LINKS) ? window.LINKS : [];
    links.forEach((link) => {
      const showId = link.show_id;
      const list = linksByShow.get(showId) || [];
      list.push(link);
      linksByShow.set(showId, list);
    });

    const shows = await loadShows();
    const showsWithSearch = shows.map((show) => ({
      ...show,
      _haystack: buildHaystack(show),
    }));

    totalCount.textContent = showsWithSearch.length.toString();
    buildYearOptions(showsWithSearch);
    buildTourOptions(showsWithSearch);
    buildVenueCityStateOptions(showsWithSearch);

    const applyFilters = () => {
      const year = yearFilter.value;
      const venue = venueFilter.value;
      const city = cityFilter.value;
      const state = stateFilter.value;
      const tour = tourFilter.value;
      const search = searchInput.value.trim().toLowerCase();
      const sortOrder = sortFilter.value;

      let filtered = showsWithSearch.filter((show) => {
        if (year !== "all" && !show.date.startsWith(year)) return false;
        if (venue !== "all" && show.venue !== venue) return false;
        if (city !== "all" && show.city !== city) return false;
        if (state !== "all" && show.state !== state) return false;
        if (tour !== "all" && normalizeTour(show.tour) !== tour) return false;
        if (search && !show._haystack.includes(search)) return false;
        return true;
      });

      filtered = filtered.sort((a, b) => {
        const delta = parseDate(a.date) - parseDate(b.date);
        return sortOrder === "asc" ? delta : -delta;
      });

      rangeCount.textContent = filtered.length.toString();
      renderShows(filtered);
    };

    [searchInput, yearFilter, venueFilter, cityFilter, stateFilter, tourFilter, sortFilter].forEach((el) =>
      el.addEventListener("input", applyFilters)
    );

    if (clearFiltersButton) {
      clearFiltersButton.addEventListener("click", () => {
        resetFilters();
        applyFilters();
      });
    }

    showList.addEventListener("click", (event) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;
      if (target.classList.contains("show-tour")) {
        const tour = target.dataset.tour;
        if (tour) {
          resetFilters();
          tourFilter.value = tour;
          tourFilter.dispatchEvent(new Event("input"));
        }
        return;
      }
      if (target.classList.contains("show-venue")) {
        const value = target.dataset.venue;
        if (value) {
          resetFilters();
          venueFilter.value = value;
          venueFilter.dispatchEvent(new Event("input"));
        }
        return;
      }
      if (target.classList.contains("show-city")) {
        const value = target.dataset.city;
        if (value) {
          resetFilters();
          cityFilter.value = value;
          cityFilter.dispatchEvent(new Event("input"));
        }
        return;
      }
      if (target.classList.contains("show-state")) {
        const value = target.dataset.state;
        if (value) {
          resetFilters();
          stateFilter.value = value;
          stateFilter.dispatchEvent(new Event("input"));
        }
        return;
      }
      if (!target.classList.contains("setlist-button")) return;
      const showId = target.dataset.showId;
      const show = showsWithSearch.find((item) => normalizeShowId(item) === showId);
      if (show) openModal(show);
    });

    setlistModal.addEventListener("click", (event) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;
      if (target.dataset.close === "true") closeModal();
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && setlistModal.classList.contains("is-open")) {
        closeModal();
      }
    });

    applyFilters();
  } catch (error) {
    showList.innerHTML =
      "<div class='show-card'>Unable to load data. Check data/shows.json.</div>";
    totalCount.textContent = "0";
    rangeCount.textContent = "0";
    // eslint-disable-next-line no-console
    console.error(error);
  }
};

init();
