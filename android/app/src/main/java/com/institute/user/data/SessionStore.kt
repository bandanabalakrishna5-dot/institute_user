package com.institute.user.data

import android.content.Context
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.emptyPreferences
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.catch
import kotlinx.coroutines.flow.map
import java.io.IOException

private val Context.dataStore by preferencesDataStore(name = "session")

class SessionStore(private val context: Context) {

    private object Keys {
        val USER_JSON = stringPreferencesKey("user_json")
    }

    val userJson: Flow<String?> = context.dataStore.data
        .catch { if (it is IOException) emit(emptyPreferences()) else throw it }
        .map { prefs -> prefs[Keys.USER_JSON] }

    suspend fun saveUser(userJson: String) {
        context.dataStore.edit { it[Keys.USER_JSON] = userJson }
    }

    suspend fun clear() {
        context.dataStore.edit { it.clear() }
    }
}