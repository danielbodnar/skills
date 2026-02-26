// Chrome Gemini Nano - Basic Usage Examples
// Basic setup and initialization patterns

// Check if Gemini Nano is available
async function checkAvailability(): Promise<string> {
  try {
    const availability = await (window as any).ai?.languageModel?.capabilities();
    
    if (!availability) {
      return 'unavailable';
    }
    
    return availability.available;
  } catch (error) {
    console.error('Error checking availability:', error);
    return 'unavailable';
  }
}

// Basic session creation and prompting
async function basicPrompting(): Promise<void> {
  try {
    const availability = await checkAvailability();
    
    if (availability !== 'readily') {
      console.log('Gemini Nano not readily available:', availability);
      return;
    }

    // Create a session
    const session = await (window as any).ai.languageModel.create({
      temperature: 0.8,
      topK: 3
    });

    // Simple prompt
    const response = await session.prompt('Explain quantum computing in simple terms');
    console.log('Response:', response);

    // Clean up
    session.destroy();
  } catch (error) {
    console.error('Error in basic prompting:', error);
  }
}

// Feature detection and graceful fallback
function hasBuiltInAI(): boolean {
  return !!(window as any).ai?.languageModel;
}

// Progressive enhancement pattern
async function enhanceWithAI(): Promise<void> {
  if (!hasBuiltInAI()) {
    console.log('Built-in AI not available, using fallback');
    // Implement server-side AI fallback
    return;
  }

  const availability = await checkAvailability();
  
  switch (availability) {
    case 'readily':
      console.log('AI ready to use');
      await basicPrompting();
      break;
    case 'after-download':
      console.log('AI available after download');
      // Show download progress UI
      break;
    case 'no':
      console.log('AI not available on this device');
      // Use fallback solution
      break;
    default:
      console.log('Unknown availability status:', availability);
  }
}

// Export for module usage
export {
  checkAvailability,
  basicPrompting,
  hasBuiltInAI,
  enhanceWithAI
};