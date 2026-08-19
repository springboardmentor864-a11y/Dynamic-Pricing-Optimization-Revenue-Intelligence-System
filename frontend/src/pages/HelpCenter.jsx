import {
  HelpCircle,
  Mail,
  Phone,
  BookOpen,
  MessageCircle,
} from "lucide-react";

export default function HelpCenter() {
  return (
    <div className="space-y-8">

      <div>
        <h1 className="text-4xl font-bold text-gray-900">
          Help Center
        </h1>

        <p className="text-gray-500 mt-2">
          Need help? Find answers or contact our support team.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        <div className="bg-white rounded-3xl shadow border p-8 text-center hover:shadow-xl transition">

          <BookOpen className="mx-auto text-blue-600" size={42} />

          <h2 className="text-xl font-bold mt-5">
            Documentation
          </h2>

          <p className="text-gray-500 mt-3">
            Read our complete documentation.
          </p>

          <button className="mt-6 bg-blue-600 text-white px-6 py-3 rounded-xl">
            Open Docs
          </button>

        </div>

        <div className="bg-white rounded-3xl shadow border p-8 text-center hover:shadow-xl transition">

          <Mail className="mx-auto text-green-600" size={42} />

          <h2 className="text-xl font-bold mt-5">
            Email Support
          </h2>

          <p className="text-gray-500 mt-3">
            support@pricepilot.ai
          </p>

          <button className="mt-6 bg-green-600 text-white px-6 py-3 rounded-xl">
            Send Email
          </button>

        </div>

        <div className="bg-white rounded-3xl shadow border p-8 text-center hover:shadow-xl transition">

          <Phone className="mx-auto text-orange-500" size={42} />

          <h2 className="text-xl font-bold mt-5">
            Contact
          </h2>

          <p className="text-gray-500 mt-3">
            +91 9876543210
          </p>

          <button className="mt-6 bg-orange-500 text-white px-6 py-3 rounded-xl">
            Call Now
          </button>

        </div>

      </div>

      <div className="bg-white rounded-3xl shadow border p-8">

        <div className="flex items-center gap-3 mb-6">

          <HelpCircle className="text-blue-600" />

          <h2 className="text-2xl font-bold">
            Frequently Asked Questions
          </h2>

        </div>

        <div className="space-y-5">

          <details className="border rounded-xl p-5">
            <summary className="font-semibold cursor-pointer">
              How does AI Price Prediction work?
            </summary>

            <p className="mt-3 text-gray-500">
              AI analyzes historical prices, demand,
              competitor data and trends to recommend
              the best selling price.
            </p>
          </details>

          <details className="border rounded-xl p-5">
            <summary className="font-semibold cursor-pointer">
              Can I export reports?
            </summary>

            <p className="mt-3 text-gray-500">
              Yes. Reports can be exported as PDF,
              Excel and CSV.
            </p>
          </details>

          <details className="border rounded-xl p-5">
            <summary className="font-semibold cursor-pointer">
              Can I track unlimited products?
            </summary>

            <p className="mt-3 text-gray-500">
              Yes, you can track unlimited products.
            </p>
          </details>

        </div>

      </div>

      <div className="bg-gradient-to-r from-blue-600 to-cyan-500 rounded-3xl text-white p-8 flex justify-between items-center">

        <div>

          <h2 className="text-2xl font-bold">
            Still need help?
          </h2>

          <p className="opacity-90 mt-2">
            Our support team usually replies within 30 minutes.
          </p>

        </div>

        <button className="bg-white text-blue-600 px-6 py-3 rounded-xl font-semibold flex items-center gap-2">

          <MessageCircle size={20} />

          Chat Support

        </button>

      </div>

    </div>
  );
}