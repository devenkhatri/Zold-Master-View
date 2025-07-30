// Simple manual test for the AMC API endpoint
// Run with: node test-amc-api.js

const testAmcApi = async () => {
  try {
    console.log('Testing AMC API endpoint...');
    
    // Test basic GET request
    console.log('\n1. Testing basic GET request...');
    const response = await fetch('http://localhost:3000/api/amc-data');
    const data = await response.json();
    
    console.log('Status:', response.status);
    console.log('Success:', data.success);
    
    if (data.success) {
      console.log('Receipts count:', data.data.receipts.length);
      console.log('Owners count:', data.data.owners.length);
      console.log('Available years:', data.data.availableYears);
      console.log('Total payments:', data.data.summary.totalPayments);
      console.log('From cache:', data._meta.fromCache);
      
      if (data._meta.validationErrors && data._meta.validationErrors.length > 0) {
        console.log('Validation errors:', data._meta.validationErrors.length);
      }
    } else {
      console.log('Error:', data.error);
      console.log('Code:', data.code);
    }
    
    // Test force refresh
    console.log('\n2. Testing force refresh...');
    const refreshResponse = await fetch('http://localhost:3000/api/amc-data?refresh=true');
    const refreshData = await refreshResponse.json();
    
    console.log('Refresh status:', refreshResponse.status);
    console.log('From cache after refresh:', refreshData._meta?.fromCache);
    
    // Test cache clear
    console.log('\n3. Testing cache clear...');
    const clearResponse = await fetch('http://localhost:3000/api/amc-data', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ action: 'clearCache' }),
    });
    const clearData = await clearResponse.json();
    
    console.log('Clear cache status:', clearResponse.status);
    console.log('Clear cache success:', clearData.success);
    
    console.log('\n✅ AMC API tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
};

// Only run if this file is executed directly
if (require.main === module) {
  testAmcApi();
}

module.exports = { testAmcApi };