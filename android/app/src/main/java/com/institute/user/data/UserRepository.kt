package com.institute.user.data

import android.content.Context
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.withContext
import java.io.IOException
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json

class UserRepository(private val context: Context) {

    private val json = Json { ignoreUnknownKeys = true }
    private val sessionStore = SessionStore(context)

    /** Returns the logged-in user, or null if not authenticated. */
    suspend fun currentUser(): UserPayload? = withContext(Dispatchers.IO) {
        val raw = sessionStore.userJson.first() ?: return@withContext null
        runCatching { json.decodeFromString<UserPayload>(raw) }.getOrNull()
    }

    suspend fun login(email: String, password: String): Result<UserPayload> =
        withContext(Dispatchers.IO) {
            runCatching {
                val res = ApiClient.api.b2cLogin(LoginRequest(email.trim(), password))
                if (res.status == "success" && res.payload != null) {
                    sessionStore.saveUser(json.encodeToString(UserPayload.serializer(), res.payload))
                    Result.success(res.payload!!)
                } else {
                    Result.failure(
                        Exception(res.error?.message ?: "Please Enter Valid Details")
                    )
                }
            }.getOrElse { e ->
                if (e is IOException) {
                    Result.failure(Exception("Network Error", e))
                } else Result.failure(e)
            }
        }

    suspend fun logout() = withContext(Dispatchers.IO) {
        sessionStore.clear()
    }
}