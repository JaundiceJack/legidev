window.onload = () => {
  if (window.location.pathname === "/") enlargeBlobs();
  if (window.location.pathname.substr(0, 9) === "/dinodata") {
    enableDelete();
    enableChart();
  }
}

// Enlarge the blob upon hovering its swap element
function enlargeBlobs() {
  const ids = ['money', 'coding', 'social', 'ideas', 'music', 'watch', 'learn', 'gallery'];
  let swaps = [];
  let blobs = [];
  ids.forEach( id => {
    swaps.push(document.getElementById(id+'S'));
    blobs.push(document.getElementById(id+'B'));
  });
  swaps.forEach( (swap, index) => {
    swap.addEventListener('mouseover', () => {
      blobs[index].style.width = "145px";
      blobs[index].style.height = "145px";
    });
    swap.addEventListener('mouseout', () => {
      blobs[index].style.width = "121px";
      blobs[index].style.height = "121px";
    });
  });
}
