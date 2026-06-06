<?php
/**
 * Plugin Name: CMS Demo Local Publisher
 * Description: Local-only REST endpoint that lets the RabbitMQ WordPress bridge create demo posts.
 * Version: 1.0.0
 */

add_action('rest_api_init', function () {
    register_rest_route('cms-demo/v1', '/posts', array(
        'methods' => 'POST',
        'callback' => 'cms_demo_create_post',
        'permission_callback' => 'cms_demo_can_create_post',
    ));
});

function cms_demo_can_create_post($request) {
    $expected_secret = getenv('CMS_DEMO_BRIDGE_SECRET') ?: 'local-demo-secret';
    $provided_secret = (string) $request->get_header('x-cms-demo-secret');

    return hash_equals($expected_secret, $provided_secret);
}

function cms_demo_create_post($request) {
    $title = sanitize_text_field($request->get_param('title'));
    $content = wp_kses_post($request->get_param('content'));
    $status = sanitize_key($request->get_param('status') ?: 'publish');

    if (!$title) {
        return new WP_Error('cms_demo_missing_title', 'A title is required.', array('status' => 400));
    }

    $post_id = wp_insert_post(array(
        'post_title' => $title,
        'post_content' => $content,
        'post_status' => $status === 'draft' ? 'draft' : 'publish',
        'post_type' => 'post',
    ), true);

    if (is_wp_error($post_id)) {
        return $post_id;
    }

    $post = get_post($post_id);

    return array(
        'id' => $post_id,
        'status' => $post->post_status,
        'link' => get_permalink($post_id),
        'modified_gmt' => get_gmt_from_date($post->post_modified),
        'title' => array('rendered' => get_the_title($post_id)),
        'excerpt' => array('rendered' => wp_trim_words($post->post_content, 40)),
    );
}
