<!--
  This component wraps the ConceptSelector to handle property types more easily
  in the main page template, and is designed to act as a drop-in replacement for IdentifierOperator
-->
<script>
  import ConceptSelector from './ConceptSelector.svelte';

  // Set up props to match IdentifierOperator's API for easy substitution
  export let value = {};
  export let options = []; // Compatibility with IdentifierOperator
  export let placeholder = "Search for concepts";
  export let label = "Select Concept";
  export let property = null; // Optional property from direct use

  import { createEventDispatcher } from 'svelte';
  const dispatch = createEventDispatcher();

  // Handle changes from the concept selector
  function handleChange(event) {
    // Dispatch the change event to match IdentifierOperator's API
    dispatch('change', event.detail);

    // If a direct onChange function was provided, call it as well
    if (property && typeof onChange === 'function') {
      onChange(property.name, event.detail);
    }
  }

  // Optional direct onChange function for use with property object
  export let onChange = null;
</script>

<ConceptSelector
  value={value || {}}
  label={property ? property.label : label}
  {placeholder}
  on:change={handleChange}
/>