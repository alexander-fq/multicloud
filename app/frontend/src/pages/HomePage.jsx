import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getPlatformInfo, getProviderInfo } from '../services/api'

function HomePage() {
  const [platformInfo, setPlatformInfo] = useState(null)
  const [providerInfo, setProviderInfo] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [platform, provider] = await Promise.all([
          getPlatformInfo(),
          getProviderInfo()
        ])
        setPlatformInfo(platform.data)
        setProviderInfo(provider.data)
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="card bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
        <h1 className="text-4xl font-bold mb-4">
          {platformInfo?.platform?.name || 'GovTech Cloud Migration Platform'}
        </h1>
        <p className="text-xl mb-6 text-blue-100">
          {platformInfo?.platform?.description}
        </p>
        <div className="flex space-x-4">
          <Link to="/migration" className="px-6 py-3 bg-white text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition-colors">
            Start Migration
          </Link>
          <Link to="/architecture" className="px-6 py-3 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-400 transition-colors">
            View Architecture
          </Link>
        </div>
      </div>

      {/* Current Provider */}
      <div className="card">
        <h2 className="text-2xl font-bold mb-4">Current Cloud Provider</h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-3xl font-bold text-primary-600 uppercase">
              {providerInfo?.current || 'AWS'}
            </p>
            <p className="text-gray-600 mt-1">
              Region: {providerInfo?.region || 'us-east-1'}
            </p>
            <span className={`badge mt-3 ${
              providerInfo?.status === 'implemented'
                ? 'badge-success'
                : 'badge-warning'
            }`}>
              {providerInfo?.status === 'implemented' ? 'IMPLEMENTED' : 'PENDING'}
            </span>
          </div>
          <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
            <span className="text-white text-3xl font-bold">
              {providerInfo?.current?.toUpperCase().slice(0, 3) || 'AWS'}
            </span>
          </div>
        </div>
      </div>

      {/* Services */}
      <div className="card">
        <h2 className="text-2xl font-bold mb-4">Active Services</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {providerInfo?.services && Object.entries(providerInfo.services).map(([key, value]) => (
            <div key={key} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-sm text-gray-600 capitalize font-medium">{key}</p>
              <p className="font-semibold text-gray-900 mt-1">{value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Features Grid */}
      <div className="grid md:grid-cols-3 gap-6">
        <div className="card hover:shadow-lg transition-shadow border-l-4 border-blue-600">
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-3">
            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </div>
          <h3 className="text-xl font-bold mb-2">Cloud Agnostic</h3>
          <p className="text-gray-600">
            Write code once, run on any cloud provider. No vendor lock-in.
          </p>
        </div>

        <div className="card hover:shadow-lg transition-shadow border-l-4 border-green-600">
          <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-3">
            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold mb-2">Fast Migration</h3>
          <p className="text-gray-600">
            Migrate between clouds in 2-3 weeks, not 6+ months.
          </p>
        </div>

        <div className="card hover:shadow-lg transition-shadow border-l-4 border-purple-600">
          <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-3">
            <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold mb-2">Cost Savings</h3>
          <p className="text-gray-600">
            Save 96-98% compared to traditional vendor solutions.
          </p>
        </div>
      </div>

      {/* Provider Comparison Matrix */}
      <div className="card">
        <h2 className="text-2xl font-bold mb-4">Multi-Cloud Service Mapping</h2>
        <p className="text-gray-600 mb-6">Equivalent services across cloud providers</p>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-gray-300">
                <th className="text-left p-3 font-bold">Service Type</th>
                <th className="text-center p-3">
                  <div className="flex flex-col items-center">
                    <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-lg flex items-center justify-center mb-2">
                      <span className="text-white font-bold text-sm">AWS</span>
                    </div>
                    <span className="badge badge-success text-xs">Implemented</span>
                  </div>
                </th>
                <th className="text-center p-3">
                  <div className="flex flex-col items-center">
                    <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-orange-600 rounded-lg flex items-center justify-center mb-2">
                      <span className="text-white font-bold text-sm">OCI</span>
                    </div>
                    <span className="badge badge-warning text-xs">Pending</span>
                  </div>
                </th>
                <th className="text-center p-3">
                  <div className="flex flex-col items-center">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-lg flex items-center justify-center mb-2">
                      <span className="text-white font-bold text-sm">GCP</span>
                    </div>
                    <span className="badge badge-warning text-xs">Pending</span>
                  </div>
                </th>
                <th className="text-center p-3">
                  <div className="flex flex-col items-center">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center mb-2">
                      <span className="text-white font-bold text-sm">Azure</span>
                    </div>
                    <span className="badge badge-warning text-xs">Pending</span>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-200 hover:bg-gray-50">
                <td className="p-3 font-semibold">Storage</td>
                <td className="p-3 text-center text-sm">S3</td>
                <td className="p-3 text-center text-sm">Object Storage</td>
                <td className="p-3 text-center text-sm">Cloud Storage</td>
                <td className="p-3 text-center text-sm">Blob Storage</td>
              </tr>
              <tr className="border-b border-gray-200 hover:bg-gray-50">
                <td className="p-3 font-semibold">Database</td>
                <td className="p-3 text-center text-sm">RDS PostgreSQL</td>
                <td className="p-3 text-center text-sm">Database Service</td>
                <td className="p-3 text-center text-sm">Cloud SQL</td>
                <td className="p-3 text-center text-sm">Database for PostgreSQL</td>
              </tr>
              <tr className="border-b border-gray-200 hover:bg-gray-50">
                <td className="p-3 font-semibold">Compute</td>
                <td className="p-3 text-center text-sm">EKS</td>
                <td className="p-3 text-center text-sm">OKE</td>
                <td className="p-3 text-center text-sm">GKE</td>
                <td className="p-3 text-center text-sm">AKS</td>
              </tr>
              <tr className="border-b border-gray-200 hover:bg-gray-50">
                <td className="p-3 font-semibold">Monitoring</td>
                <td className="p-3 text-center text-sm">CloudWatch</td>
                <td className="p-3 text-center text-sm">Monitoring</td>
                <td className="p-3 text-center text-sm">Cloud Operations</td>
                <td className="p-3 text-center text-sm">Monitor</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-900">
            <span className="font-semibold">Key Insight:</span> Same functionality, different names. Our interface-based architecture abstracts these differences.
          </p>
        </div>
      </div>

      {/* Cost Comparison Chart */}
      <div className="card bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
        <h2 className="text-2xl font-bold mb-4 text-purple-900">Cost Comparison</h2>
        <p className="text-gray-700 mb-6">Annual costs: Traditional vendor vs Our solution</p>
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Traditional Vendor Solution</span>
              <span className="text-lg font-bold text-red-600">$10,000,000</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-8 relative overflow-hidden">
              <div className="bg-gradient-to-r from-red-500 to-red-600 h-8 rounded-full flex items-center justify-end pr-4" style={{width: '100%'}}>
                <span className="text-white text-xs font-semibold">100%</span>
              </div>
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Our Multi-Cloud Platform</span>
              <span className="text-lg font-bold text-green-600">$400,000</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-8 relative overflow-hidden">
              <div className="bg-gradient-to-r from-green-500 to-green-600 h-8 rounded-full flex items-center justify-end pr-4" style={{width: '4%'}}>
                <span className="text-white text-xs font-semibold whitespace-nowrap ml-2">4%</span>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-6 p-4 bg-green-100 rounded-lg border-2 border-green-400">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-green-800">96% Cost Savings</p>
              <p className="text-sm text-green-700 mt-1">Save $9.6M annually</p>
            </div>
            <div className="text-right">
              <p className="text-4xl font-bold text-green-600">$9.6M</p>
              <p className="text-xs text-green-700">Saved per year</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="card bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
        <h2 className="text-2xl font-bold mb-4 text-green-900">Platform Statistics</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div>
            <p className="text-3xl font-bold text-green-600">4</p>
            <p className="text-sm text-green-700 mt-1">Cloud Providers</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-green-600">100%</p>
            <p className="text-sm text-green-700 mt-1">Cloud Agnostic</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-green-600">2-3</p>
            <p className="text-sm text-green-700 mt-1">Weeks Migration</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-green-600">96%</p>
            <p className="text-sm text-green-700 mt-1">Cost Reduction</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default HomePage
