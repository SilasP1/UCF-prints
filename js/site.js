const menuButton = document.querySelector(".menu-toggle");
const siteNav = document.querySelector("#siteNav");

if (menuButton && siteNav) {
  menuButton.addEventListener("click", () => {
    const isOpen = siteNav.classList.toggle("is-open");
    menuButton.setAttribute("aria-expanded", String(isOpen));
  });
}
