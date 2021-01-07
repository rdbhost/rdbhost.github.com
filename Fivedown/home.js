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
    let projects = Object.keys(JSON.parse(contents.toString()).projects);
    var homeList = document.querySelector("#home-list");
    homeList.innerHTML = "<h2>Here are your projects:</h2>";

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
