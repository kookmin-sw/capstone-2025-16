<!--
  This component wraps the DirectConceptSelector to handle property types more easily
  in the main page template, with direct value mapping without operators
-->
<script>
  import DirectConceptSelector from './DirectConceptSelector.svelte';

  // For direct concept selection, value can be a string or an object with eq/neq properties
  export let value = {}; 
  export let placeholder = "Search for concepts";
  export let label = "Select Concept";
  export let property = null; // Optional property from direct use

  import { createEventDispatcher } from 'svelte';
  const dispatch = createEventDispatcher();

  // Extract the actual concept ID value from the current value (which might be an operator object)
  let conceptId = '';
  
  // Initialize the conceptId from the value object if needed
  $: {
    if (typeof value === 'string') {
      conceptId = value;
    } else if (value && typeof value === 'object') {
      // Extract from eq operator if available
      if (value.eq) {
        conceptId = Array.isArray(value.eq) ? value.eq[0] : value.eq;
      } else if (value.neq) {
        conceptId = Array.isArray(value.neq) ? value.neq[0] : value.neq;
      }
    }
  }

  // Handle changes from the concept selector - directly use the concept ID
  function handleChange(event) {
    const newConceptId = event.detail;
    
    // Create a simple object with eq operator
    const simpleValue = newConceptId ? newConceptId : undefined;
    
    // Dispatch the change event to match expected API
    dispatch('change', simpleValue);

    // If a direct onChange function was provided, call it as well
    if (property && typeof onChange === 'function') {
      onChange(property.name, simpleValue);
    }
  }

  // Optional direct onChange function for use with property object
  export let onChange = null;
</script>

<DirectConceptSelector
  value={conceptId}
  label={property ? property.label : label}
  {placeholder}
  on:change={handleChange}
/>