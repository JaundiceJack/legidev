window.onload = () => {
  let deleteBs = document.getElementsByClassName('deleteReptile');
  if (deleteBs.length > 0) {
    let delete_button = deleteBs[0];
    delete_button.addEventListener('click', (e) => {
      const target = e.target;
      const id = target.getAttribute('data-id');
      // TODO: open an 'are you sure?' prompt before deleting
      remove(id);
    })
  }
}

function remove(id) {
	let req = new XMLHttpRequest();
	req.open("DELETE", "/dinodata/cage/edit/"+id, true);
	req.onreadystatechange = () => {
		if (req.readyState == 4 && req.status == 200) {
      window.alert('Deleting reptile...')
			window.location.href = "/dinodata/cage";
		}
	}
  req.send("");
}
