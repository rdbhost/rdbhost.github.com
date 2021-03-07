function deleteProject(name) {
  var homeList = document.querySelector("#home-list");
  var delList = document.querySelector("#del-list");
  var fs = require("fs");
  fs.readFile("projects.json", async function (err, contents) {
    contents = JSON.parse(contents.toString()).projects;
    delete contents[name];
    fs.writeFile(
      "/projects.json",
      JSON.stringify({ projects: contents }),
      function (err) {
        fs.unlink(`/${name}.json`, () => {
          homeList.innerHTML = "";
          contents = Object.keys(contents);
          contents.forEach((p) => {
            homeList.innerHTML += ` 
        <li>
          <a
            href="#test"
            onclick="window.location.replace('#${p}'); window.location.reload()"
            >${p}</a
          >
        </li>`;
          });
          document.querySelector("#del-modal").style.display = "none";
          window.location.reload();
        });
      }
    );
  });
}

function navigationShow(firstRender, contents, defaultConfig) {
  var home = document.querySelector("#home");
  home.innerHTML = ` 
      <h1>Welcome to FiveDown</h1>
      <button id="proj-butt">Create a project</button>
      <ul id="home-list">
      </ul>`;
  var projButt = document.querySelector("#proj-butt");
  var createModal = document.querySelector("#creator-modal");
  var createClose = document.querySelector("#creator-close");
  var createSubmit = document.querySelector("#creator-submit");
  var projName = document.querySelector("#proj-name");

  createClose.onclick = function () {
    createModal.style.display = "none";
  };

  projButt.onclick = function (e) {
    createModal.style.display = "block";
  };

  createSubmit.onclick = function () {
    let proj = projName.value;
    if (proj.length) {
      createModal.style.display = "none";
      window.location.replace(`#${proj}`);
      window.location.reload();
    }
  };
  if (!firstRender) {
    home.innerHTML = ` 
    <h1>Welcome to FiveDown</h1>
    <div id="del-modal" class="modal">
        <div class="modal-content">
          <span class="close" onclick="document.querySelector('#del-modal').style.display = 'none';">&times;</span>
          <p>Select a project to delete</p>
          <ul id="del-list"></ul>
        </div>
      </div>
       <button id="proj-butt">Create a project</button>
       <button id="del-butt">Delete a project</button>
         <ul id="home-list">
        </ul>`;
    var projButt = document.querySelector("#proj-butt");
    projButt.onclick = function (e) {
      createModal.style.display = "block";
    };
    var delButt = document.querySelector("#del-butt");
    let projects = Object.keys(JSON.parse(contents.toString()).projects);

    var delList = document.querySelector("#del-list");
    var homeList = document.querySelector("#home-list");
    homeList.innerHTML = "<h2>Here are your projects:</h2>";
    delButt.onclick = () => {
      delList.innerHTML = "";
      projects.forEach((p) => {
        delList.innerHTML += ` 
        <li>
          <a
            onclick="deleteProject('${p}')"
            >${p}</a
          >
        </li>`;
      });
      document.querySelector("#del-modal").style.display = "block";
    };

    projects.forEach((p) => {
      homeList.innerHTML += ` 
        <li>
          <a
            href="#test"
            onclick="window.location.replace('#${p}'); window.location.reload()"
            >${p}</a
          >
        </li>`;
    });
  }
}
