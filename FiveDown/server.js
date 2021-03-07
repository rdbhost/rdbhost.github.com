window.indexedDB =
  window.indexedDB ||
  window.mozIndexedDB ||
  window.webkitIndexedDB ||
  window.msIndexedDB;

const dbName = "devDB";

var request = indexedDB.open(dbName);

request.onerror = function (event) {
  // Handle errors.
};

request.onsuccess = function (event) {
  var db = event.target.result;
  BrowserFS.install(window);

  BrowserFS.configure(
    {
      fs: "MountableFileSystem",
      options: {
        "/": {
          fs: "IndexedDB",
          options: {
            storeName: "DATA_JSON",
          },
        },
      },
    },
    function (e) {
      if (e) {
        // An error happened!
        throw e;
      }
      var fs = require("fs");
      const defaultConfig = {
        Alts: "0",
        removedAlts: [],
        variables: { alt: {} },
        rowData: [
          {
            definition: "",
            name: "",
            description: "",
            alt: "0",
            unit: "",
          },
          {
            definition: "",
            name: "",
            description: "",
            alt: "0",
            unit: "",
          },
          {
            definition: "",
            name: "",
            description: "",
            alt: "0",
            unit: "",
          },
          {
            definition: "",
            name: "",
            description: "",
            alt: "0",
            unit: "",
          },
          {
            definition: "",
            name: "",
            description: "",
            alt: "0",
            unit: "",
          },
          {
            definition: "",
            name: "",
            description: "",
            alt: "0",
            unit: "",
          },
          {
            definition: "",
            name: "",
            description: "",
            alt: "0",
            unit: "",
          },
          {
            definition: "",
            name: "",
            description: "",
            alt: "0",
            unit: "",
          },
          {
            definition: "",
            name: "",
            description: "",
            alt: "0",
            unit: "",
          },
          {
            definition: "",
            name: "",
            description: "",
            alt: "0",
            unit: "",
          },
          {
            definition: "",
            name: "",
            description: "",
            alt: "0",
            unit: "",
          },
        ],
        columnDefs: [
          {
            headerName: "",
            field: "Row Order",
            suppressMovable: true,
            rowDrag: true,
            lockPosition: true,
            lockPinned: false,
            width: 50,
          },
          {
            headerName: "Description",
            field: "description",
            editable: true,
            resizable: true,
            lockPinned: true,
          },
          {
            headerName: "Name",
            field: "name",
            editable: true,
            resizable: true,
            lockPinned: true,
          },
          {
            headerName: "Definition",
            field: "definition",
            editable: true,
            resizable: true,
            lockPinned: true,
          },
          {
            headerName: "Alt",
            field: "alt",
            editable: true,
            resizable: true,
            lockPinned: true,
            cellClassRules: {
              "grid-green": "!data.definition && data.alt",
              "grid-blue": "data.definition",
              "grid-white": "!data.definition && data.alt =='0'",
            },
          },
          {
            headerName: "Unit",
            field: "unit",
            editable: true,
            resizable: true,
            lockPinned: true,
          },
        ],
      };
      const defaultProjects = { projects: {} };

      let currentProject = window.location.href.split("#")[1];

      function initializeProjects() {
        fs.stat("/projects.json", (e, c) => {
          if (c) {
            fs.readFile("projects.json", async function (err, contents) {
              if (contents) {
                let proj = await JSON.parse(contents.toString()).projects;
                proj[currentProject] = 1;
                fs.writeFile(
                  "/projects.json",
                  JSON.stringify({ projects: proj }),
                  function (err) {
                    fs.writeFile(
                      `/${currentProject}.json`,
                      JSON.stringify(defaultConfig),
                      function (err) {
                        initializeApp(defaultConfig, currentProject);
                      }
                    );
                  }
                );
              } else {
                showHome();
              }
            });
          } else {
            showHome();
          }
        });
      }

      function showHome() {
        fs.readFile("/projects.json", async function (err, contents) {
          if (!contents) {
            fs.writeFile(
              "/projects.json",
              JSON.stringify(defaultProjects),
              function (err) {
                navigationShow(
                  true,
                  JSON.stringify(defaultProjects),
                  defaultConfig
                );
              }
            );
          } else {
            navigationShow(false, contents, defaultConfig);
          }
        });
      }

      if (!currentProject || currentProject == "projects") {
        showHome();
        return;
      } else {
        fs.readFile(`/${currentProject}.json`, function (err, c) {
          if (!c) {
            initializeProjects();
          } else {
            initializeApp(JSON.parse(c), currentProject); //Change this config though! Does not register deletions
          }
        });
      }
    }
  );
};
