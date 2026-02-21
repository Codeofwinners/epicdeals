"use client";

export default function PreviewPage() {
  return (
    <div className="bg-gray-50 min-h-screen">
      
      {/* Content Preview */}
      <main className="px-4 md:px-8 py-16">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-2xl shadow-lg p-12 mb-12 border border-gray-200">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Component Preview
            </h1>
            <p className="text-lg text-gray-600 mb-8">
              This is a preview of the new Header and Footer components that will be used across all pages.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
              <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-6 border border-blue-200">
                <h2 className="font-bold text-gray-900 mb-2">✓ Header Features</h2>
                <ul className="text-sm text-gray-700 space-y-2">
                  <li>✓ Responsive (mobile & desktop)</li>
                  <li>✓ Search functionality</li>
                  <li>✓ Auth button integration</li>
                  <li>✓ Tab navigation</li>
                  <li>✓ Filter button</li>
                  <li>✓ Smooth animations</li>
                </ul>
              </div>
              
              <div className="bg-gradient-to-br from-cyan-50 to-blue-50 rounded-xl p-6 border border-cyan-200">
                <h2 className="font-bold text-gray-900 mb-2">✓ Footer Features</h2>
                <ul className="text-sm text-gray-700 space-y-2">
                  <li>✓ 5-column layout (desktop)</li>
                  <li>✓ Social media icons</li>
                  <li>✓ Multiple link sections</li>
                  <li>✓ Privacy & Terms links</li>
                  <li>✓ Mobile responsive</li>
                  <li>✓ Copyright & branding</li>
                </ul>
              </div>
            </div>

            <div className="bg-blue-100 border-l-4 border-blue-500 p-6 rounded">
              <p className="text-blue-900 font-semibold">
                👉 Scroll down to see the Footer component in action
              </p>
            </div>
          </div>
        </div>
      </main>

    </div>
  );
}
