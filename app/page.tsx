// app/page.tsx
export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">
          Trade Show Portal - Setup Test
        </h1>
        
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">✅ Project Created Successfully!</h2>
          <p className="text-gray-600 mb-4">
            Your Trade Show Portal is set up and ready. Let's test the ApparelMagic API connection.
          </p>
          
          <a 
            href="/api/apparelmagic/test"
            target="_blank"
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
          >
            Test API Connection →
          </a>
        </div>
        
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-semibold text-blue-900 mb-2">Next Steps:</h3>
          <ol className="list-decimal list-inside space-y-2 text-blue-800">
            <li>Click the button above to test your API connection</li>
            <li>You should see your products and customers data</li>
            <li>Then we'll build the admin interface</li>
          </ol>
        </div>
      </div>
    </div>
  );
}