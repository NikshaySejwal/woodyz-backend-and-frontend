from urllib.parse import urlparse


def is_loopback_target(base_url):
    hostname = (urlparse(base_url).hostname or "").lower()
    return hostname in {"localhost", "127.0.0.1", "::1"} or hostname.endswith(".localhost")


def target_safety_error(base_url, allow_remote_mutations, run_live_payment, allow_live_payment):
    if not is_loopback_target(base_url) and not allow_remote_mutations:
        return "remote write-capable audit blocked; set WOODYZ_ALLOW_REMOTE_MUTATIONS=1 only for an isolated staging environment, never production"
    if run_live_payment and not allow_live_payment:
        return "live payment test blocked; set WOODYZ_ALLOW_LIVE_PAYMENT=1 only when a real charge and order are explicitly intended"
    return None
