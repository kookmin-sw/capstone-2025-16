export function tooltip(element) {
	let div;
	let name;
    let gender;
    let age;
    let date;
    let domain;
	function mouseOver(event) {
		// NOTE: remove the `title` attribute, to prevent showing the default browser tooltip
		// remember to set it back on `mouseleave`
		name = element.getAttribute('name');
		element.removeAttribute('name');

        gender = element.getAttribute('gender');
		element.removeAttribute('gender');

        age = element.getAttribute('age');
		element.removeAttribute('age');

        date = element.getAttribute('date');
		element.removeAttribute('date');

        domain = element.getAttribute('domain');
		element.removeAttribute('domain');

		div = document.createElement('div');
		div.textContent = `name : ${name}\ngender : ${gender}\nage : ${age}\ndate : ${date}\ndomain : ${domain}`;
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
		element.setAttribute('name', name);
        element.setAttribute('gender', gender);
        element.setAttribute('age', age);
        element.setAttribute('date', date);
        element.setAttribute('domain', domain);
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
