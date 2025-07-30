// Simple test to verify the sticker data hook integration
// This tests the API endpoint that the hook will use

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

async function testStickerHookIntegration() {
  console.log('Testing Sticker Hook Integration...\n');
  
  try {
    // Test the API endpoint that the hook uses
    console.log('Testing sticker data API endpoint...');
    const response = await fetch(`${BASE_URL}/api/sticker-data`);
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(`API Error: ${data.error}`);
    }
    
    console.log('✅ API endpoint working correctly');
    console.log(`   - ${data.data.owners.length} owners loaded`);
    console.log(`   - ${data.data.summary.totalFlats} total flats`);
    console.log(`   - ${data.data.summary.assignmentRate}% assignment rate`);
    
    // Test data structure matches what the hook expects
    const requiredFields = ['owners', 'statistics', 'summary'];
    const missingFields = requiredFields.filter(field => !data.data[field]);
    
    if (missingFields.length > 0) {
      throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
    }
    
    console.log('✅ Data structure matches hook expectations');
    
    // Test owner data structure
    if (data.data.owners.length > 0) {
      const sampleOwner = data.data.owners[0];
      const requiredOwnerFields = ['id', 'blockNumber', 'flatNumber', 'memberName', 'stickerNos'];
      const missingOwnerFields = requiredOwnerFields.filter(field => sampleOwner[field] === undefined);
      
      if (missingOwnerFields.length > 0) {
        throw new Error(`Missing owner fields: ${missingOwnerFields.join(', ')}`);
      }
      
      console.log('✅ Owner data structure is correct');
    }
    
    // Test statistics structure
    const requiredStatsFields = ['totalFlats', 'assignedFlats', 'unassignedFlats', 'totalStickers'];
    const missingStatsFields = requiredStatsFields.filter(field => data.data.statistics[field] === undefined);
    
    if (missingStatsFields.length > 0) {
      throw new Error(`Missing statistics fields: ${missingStatsFields.join(', ')}`);
    }
    
    console.log('✅ Statistics structure is correct');
    
    // Test cache functionality
    console.log('\nTesting cache functionality...');
    const cachedResponse = await fetch(`${BASE_URL}/api/sticker-data`);
    const cachedData = await cachedResponse.json();
    
    if (cachedData._meta.fromCache) {
      console.log('✅ Cache is working correctly');
    } else {
      console.log('ℹ️  Cache not used (expected for first few requests)');
    }
    
    console.log('\n🎉 All tests passed! Sticker hook integration is ready.');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    
    if (error.message.includes('fetch')) {
      console.log('\n💡 Make sure the development server is running:');
      console.log('   npm run dev');
    }
    
    process.exit(1);
  }
}

// Run the test
testStickerHookIntegration();