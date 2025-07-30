// Test script for the sticker data API endpoint
// Run with: node test-sticker-api.js

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

async function testStickerApi() {
  console.log('Testing Sticker Data API...\n');
  
  try {
    // Test GET endpoint
    console.log('1. Testing GET /api/sticker-data');
    const getResponse = await fetch(`${BASE_URL}/api/sticker-data`);
    const getData = await getResponse.json();
    
    console.log('Status:', getResponse.status);
    console.log('Success:', getData.success);
    
    if (getData.success) {
      console.log('Data summary:');
      console.log('- Total owners:', getData.data.owners.length);
      console.log('- Total flats:', getData.data.summary.totalFlats);
      console.log('- Assigned flats:', getData.data.summary.assignedFlats);
      console.log('- Assignment rate:', getData.data.summary.assignmentRate + '%');
      console.log('- From cache:', getData._meta.fromCache);
      
      if (getData._meta.validationErrors) {
        console.log('- Validation errors:', getData._meta.validationErrors.length);
      }
      
      // Show sample owner data
      if (getData.data.owners.length > 0) {
        console.log('\nSample owner data:');
        const sampleOwner = getData.data.owners[0];
        console.log('- Block:', sampleOwner.blockNumber);
        console.log('- Flat:', sampleOwner.flatNumber);
        console.log('- Member:', sampleOwner.memberName);
        console.log('- Stickers:', sampleOwner.stickerNos || 'None');
      }
    } else {
      console.log('Error:', getData.error);
      console.log('Code:', getData.code);
    }
    
    console.log('\n' + '='.repeat(50) + '\n');
    
    // Test cache clearing
    console.log('2. Testing POST /api/sticker-data (clear cache)');
    const postResponse = await fetch(`${BASE_URL}/api/sticker-data`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ action: 'clearCache' }),
    });
    
    const postData = await postResponse.json();
    console.log('Status:', postResponse.status);
    console.log('Success:', postData.success);
    console.log('Message:', postData.message);
    
    console.log('\n' + '='.repeat(50) + '\n');
    
    // Test forced refresh
    console.log('3. Testing GET /api/sticker-data?refresh=true');
    const refreshResponse = await fetch(`${BASE_URL}/api/sticker-data?refresh=true`);
    const refreshData = await refreshResponse.json();
    
    console.log('Status:', refreshResponse.status);
    console.log('Success:', refreshData.success);
    
    if (refreshData.success) {
      console.log('From cache:', refreshData._meta.fromCache);
      console.log('Should be false (fresh data)');
    }
    
  } catch (error) {
    console.error('Test failed:', error.message);
    
    if (error.message.includes('fetch')) {
      console.log('\nMake sure the development server is running:');
      console.log('npm run dev');
    }
  }
}

// Run the test
testStickerApi();