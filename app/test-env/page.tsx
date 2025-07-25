'use client';

export default function EnvTestPage() {
  const envVars = {
    'USE_MOCK_DATA': process.env.USE_MOCK_DATA,
    'GOOGLE_SHEETS_API_KEY': process.env.GOOGLE_SHEETS_API_KEY ? '*** (set)' : 'Not set',
    'GOOGLE_SHEETS_ID': process.env.GOOGLE_SHEETS_ID || 'Not set',
    'GOOGLE_SHEETS_OWNERS_RANGE': process.env.GOOGLE_SHEETS_OWNERS_RANGE || 'Not set',
    'NEXT_PUBLIC_TEST': process.env.NEXT_PUBLIC_TEST || 'Not set (Note: Client-side only available if prefixed with NEXT_PUBLIC_)',
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Environment Variables Test</h1>
      <div className="bg-gray-100 p-6 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Server-side Environment Variables</h2>
        <table className="min-w-full bg-white border border-gray-200">
          <thead>
            <tr className="bg-gray-50">
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Variable</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Value</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {Object.entries(envVars).map(([key, value]) => (
              <tr key={key}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{key}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {value === '' ? '(empty string)' : String(value)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="mt-4 text-sm text-gray-600">
          <p className="font-medium">Note:</p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li>Server-side environment variables are only available in server components and API routes by default.</li>
            <li>To expose a variable to the browser, prefix it with <code>NEXT_PUBLIC_</code>.</li>
            <li>Environment variables are loaded from <code>.env.local</code> in development.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
