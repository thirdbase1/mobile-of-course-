export async function GET() {
  return Response.json({
    apiKey: process.env.MONNIFY_API_KEY ? `${process.env.MONNIFY_API_KEY.substring(0, 4)}...` : '',
    secretKey: process.env.MONNIFY_SECRET_KEY ? `${process.env.MONNIFY_SECRET_KEY.substring(0, 4)}...` : '',
    contractCode: process.env.MONNIFY_CONTRACT_CODE || '',
  })
}
