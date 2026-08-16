package com.institute.user.data

import kotlinx.serialization.Serializable

@Serializable
data class LoginRequest(
    val emlid: String = "",
    val pswrd: String = ""
)

@Serializable
data class B2CLoginResponse(
    val payload: UserPayload? = null,
    val status: String = "",
    val error: ErrorDetail? = null
)

@Serializable
data class ErrorDetail(
    val message: String? = null,
    val error: Boolean? = null
)

/**
 * Mirrors the fields returned by the /B2C-login endpoint for
 * STUDENT / STAFF / TRANSPORT users. All fields included so the
 * raw payload can be rendered regardless of role.
 */
@Serializable
data class UserPayload(
    val usrid: String = "",
    val emlid: String = "",
    val tle: String = "",
    val intlnm: String = "",
    val fnm: String = "",
    val lnm: String = "",
    val typ: String = "",
    val cds: String = "",
    val instid: String = "",
    val brcid: String = "",
    val clsid: String = "",
    val secid: String = "",
    val stdid: String = "",
    val stdnm: String = "",
    val clsnm: String = "",
    val secnm: String = "",
    val pturl: String = "",
    val acdmcyr: String = "",
    val stdrolid: String = "",
    val mbleno: String = "",
    val stfid: String = "",
    val stfnm: String = "",
    val stfrolid: String = "",
    val drvid: String = "",
    val drvnm: String = "",
    val frrt: String = "",
    val tort: String = "",
    val stpno: String = "",
    val velno: String = "",
    val veltyp: String = "",
) {
    val displayName: String
        get() = listOf(stdnm, stfnm, drvnm)
            .firstOrNull { !it.isNullOrBlank() }
            ?: emlid
}