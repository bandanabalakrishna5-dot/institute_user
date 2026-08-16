package com.institute.user.ui

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import android.content.Context
import com.institute.user.data.UserPayload
import com.institute.user.data.UserRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class LoginUiState(
    val isLoading: Boolean = false,
    val error: String? = null,
    val user: UserPayload? = null,
    val loggedIn: Boolean = false
)

class UserViewModel(private val repository: UserRepository) : ViewModel() {

    class Factory(private val context: Context) : ViewModelProvider.Factory {
        @Suppress("UNCHECKED_CAST")
        override fun <T : ViewModel> create(modelClass: Class<T>): T {
            return UserViewModel(UserRepository(context.applicationContext)) as T
        }
    }

    private val _state = MutableStateFlow(LoginUiState())
    val state: StateFlow<LoginUiState> = _state.asStateFlow()

    init {
        checkSession()
    }

    private fun checkSession() {
        viewModelScope.launch {
            val user = repository.currentUser()
            if (user != null) {
                _state.value = LoginUiState(user = user, loggedIn = true)
            }
        }
    }

    fun login(email: String, password: String) {
        if (email.isBlank() || password.isBlank()) {
            _state.value = _state.value.copy(error = "Please enter Email/Mobile and Password")
            return
        }
        viewModelScope.launch {
            _state.value = _state.value.copy(isLoading = true, error = null)
            repository.login(email, password)
                .onSuccess { user ->
                    _state.value = LoginUiState(user = user, loggedIn = true)
                }
                .onFailure { e ->
                    _state.value = _state.value.copy(isLoading = false, error = e.message)
                }
        }
    }

    fun logout() {
        viewModelScope.launch {
            repository.logout()
            _state.value = LoginUiState()
        }
    }

    fun clearError() {
        _state.value = _state.value.copy(error = null)
    }
}