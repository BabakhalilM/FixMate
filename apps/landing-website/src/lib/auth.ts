// // src/lib/auth.ts
// import { NextAuthOptions } from 'next-auth';
// import CredentialsProvider from 'next-auth/providers/credentials';
// import axios from 'axios';

// const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

// export const authOptions: NextAuthOptions = {
//   providers: [
//     CredentialsProvider({
//       name: 'Credentials',
//       credentials: {
//         email: { label: 'Email', type: 'email' },
//         password: { label: 'Password', type: 'password' },
//         role: { label: 'Role', type: 'text' },
//       },
//       async authorize(credentials) {
//         try {
//           // Call your API server
//           const response = await axios.post(`${API_URL}/auth/login`, {
//             email: credentials?.email,
//             password: credentials?.password,
//           });

//           const { user, token } = response.data.data;

//           if (user) {
//             // Return user object with token
//             return {
//               id: user.id,
//               email: user.email,
//               name: user.name,
//               role: user.role,
//               token: token,
//               phone: user.phone,
//             };
//           }
//           return null;
//         } catch (error) {
//           console.error('Auth error:', error);
//           return null;
//         }
//       },
//     }),
//   ],
//   callbacks: {
//     async jwt({ token, user }) {
//       if (user) {
//         token.id = user.id;
//         token.role = user.role;
//         token.token = user.token;
//         token.phone = user.phone;
//       }
//       return token;
//     },
//     async session({ session, token }) {
//       if (session.user) {
//         session.user.id = token.id as string;
//         session.user.role = token.role as string;
//         session.user.token = token.token as string;
//         session.user.phone = token.phone as string;
//       }
//       return session;
//     },
//   },
//   pages: {
//     signIn: '/login',
//     signUp: '/register',
//     error: '/auth/error',
//   },
//   session: {
//     strategy: 'jwt',
//     maxAge: 30 * 24 * 60 * 60, // 30 days
//   },
//   secret: process.env.NEXTAUTH_SECRET || 'your-secret-key',
//   debug: process.env.NODE_ENV === 'development',
// };