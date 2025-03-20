export function tooltip(element) {
	let div;
    let start_date;
    let end_date;
    let visit_concept_id;
	function mouseOver(event) {
		// NOTE: remove the `title` attribute, to prevent showing the default browser tooltip
		// remember to set it back on `mouseleave`
        start_date = element.getAttribute('start_date');
		element.removeAttribute('start_date');

        end_date = element.getAttribute('end_date');
		element.removeAttribute('end_date');

        visit_concept_id = element.getAttribute('visit_concept_id');
		element.removeAttribute('visit_concept_id');

		div = document.createElement('div');
		div.textContent = `visit_concept_id : ${visit_concept_id}\nstart_date : ${start_date}\nend_date : ${end_date}`;
		div.style = `
			border: 1px solid #ddd;
			box-shadow: 1px 1px 1px #ddd;
			background: white;
			border-radius: 4px;
			padding: 4px;
			position: absolute;
			top: ${event.pageX + 5}px;
			left: ${event.pageY + 5}px;
            white-space: pre-line;
            font-size: 12px;
		`;
		document.body.appendChild(div);
	}
	function mouseMove(event) {
		div.style.left = `${event.pageX + 5}px`;
		div.style.top = `${event.pageY + 5}px`;
	}
	function mouseLeave() {
		document.body.removeChild(div);
		// NOTE: restore the `title` attribute
        element.setAttribute('visit_concept_id', visit_concept_id);
		element.setAttribute('start_date', start_date);
        element.setAttribute('end_date', end_date);
	}
	
	element.addEventListener('mouseover', mouseOver);
    element.addEventListener('mouseleave', mouseLeave);
	element.addEventListener('mousemove', mouseMove);
	
	return {
		destroy() {
			element.removeEventListener('mouseover', mouseOver);
			element.removeEventListener('mouseleave', mouseLeave);
			element.removeEventListener('mousemove', mouseMove);
		}
	}
}
